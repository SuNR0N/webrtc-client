import { Dispatch } from 'react';
import adapter from 'webrtc-adapter';

import { WebRTCContextAction, WebRTCContextActionType } from '../actions/webrtc-context-action';
import {
  byeMessage,
  Candidate,
  candidateMessage,
  RemoteInboundStatistics,
  OutboundStatistics,
  SendSignalingMessage,
  WebRTCContextState,
} from '../models';

export const setCodecPreferencesSupported = 'RTCRtpTransceiver' in window && 'setCodecPreferences' in window.RTCRtpTransceiver.prototype;
export const setParametersSupported = 'RTCRtpSender' in window && 'setParameters' in window.RTCRtpSender.prototype;

export const createPeerConnection = (
  id: string,
  state: WebRTCContextState,
  dispatch: Dispatch<WebRTCContextAction>,
  sendSignalingMessage: SendSignalingMessage,
  iceServers?: RTCIceServer[]
): RTCPeerConnection => {
  const pc = new RTCPeerConnection({ iceServers });
  pc.addEventListener('icecandidate', ({ candidate }) => {
    if (candidate) {
      sendSignalingMessage(candidateMessage({ id, candidate }));
    }
  });
  pc.addEventListener('track', ({ streams }) => {
    dispatch({ type: WebRTCContextActionType.UpdateRemoteStream, payload: streams[0] });
  });
  pc.addEventListener('iceconnectionstatechange', () => {
    console.log(id, 'iceconnectionstatechange', pc.iceConnectionState);
  });
  pc.addEventListener('connectionstatechange', async () => {
    console.log(id, 'connectionstatechange', pc.connectionState);
    if (pc.connectionState === 'connected') {
      const statsReport = await pc.getStats();
      dispatch({ type: WebRTCContextActionType.UpdateStatsReport, payload: statsReport });
    }
  });
  pc.addEventListener('signalingstatechange', () => {
    console.log(id, 'signalingstatechange', pc.signalingState);
  });

  const queryStatsIntervalId = setInterval(async () => {
    if (pc.signalingState === 'closed') {
      clearInterval(queryStatsIntervalId);
      return;
    }
    const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
    const statsReport = await sender?.getStats();
    if (statsReport) {
      dispatch({ type: WebRTCContextActionType.UpdateStatsReport, payload: statsReport });
    }
  }, state.queryStatsInterval);

  const querySynchronizationSourcesIntervalId = setInterval(() => {
    if (pc.signalingState === 'closed') {
      clearInterval(querySynchronizationSourcesIntervalId);
      return;
    }
    const receiver = pc.getReceivers().find((r) => r.track.kind === 'audio');
    if (receiver && receiver.getSynchronizationSources) {
      const [source] = receiver.getSynchronizationSources();
      dispatch({ type: WebRTCContextActionType.UpdateRemoteAudioLevel, payload: source?.audioLevel });
    }
  }, state.querySynchronizationSourcesInterval);

  return pc;
};

export const hangUp = (id: string, peers: Map<string, RTCPeerConnection>, sendSignalingMessage: SendSignalingMessage) => {
  const peer = peers.get(id);
  if (!peer) {
    console.log(`Peer with id '${id}' does not exist`);
    return;
  }

  peer.close();
  peers.delete(id);

  // Tell the other side
  sendSignalingMessage(byeMessage({ id }));
};

export const replaceVideoTrack = (peers: Map<string, RTCPeerConnection>, withTrack?: MediaStreamTrack) => {
  if (withTrack) {
    peers.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(withTrack);
      }
    });
  }
};

export const calculateRemoteInboundStatistics = (statsReport: RTCStatsReport): RemoteInboundStatistics | undefined => {
  const [, inboundRTPReport] = Array.from(statsReport.entries()).find(([, report]) => report.type === 'remote-inbound-rtp') || [];
  if (inboundRTPReport) {
    const { jitter, packetsLost, roundTripTime } = inboundRTPReport;
    const latency = roundTripTime / 2;
    console.log(`Jitter ${jitter}, latency ${latency}ms, round-trip time ${roundTripTime}ms, packets lost ${packetsLost}`);
    return {
      jitter,
      latency,
      packetsLost,
      roundTripTime,
    };
  }
};

export const calculateOutboundStatistics = (
  statsReport: RTCStatsReport,
  latestStatsReport?: RTCStatsReport
): OutboundStatistics | undefined => {
  const [, outboundRTPReport] =
    Array.from(statsReport.entries()).find(([, report]) => report.type === 'outbound-rtp' && !report.isRemote) || [];
  const previousOutboundRTPReport = latestStatsReport?.get(outboundRTPReport?.id);
  if (outboundRTPReport && previousOutboundRTPReport) {
    const { bytesSent, framesPerSecond, headerBytesSent, packetsSent, timestamp } = outboundRTPReport;
    const {
      timestamp: prevTimestamp,
      bytesSent: prevBytesSent,
      headerBytesSent: prevHeaderBytesSent,
      packetsSent: prevPacketsSent,
    } = previousOutboundRTPReport;
    // calculate bitrate
    const timeDiff = timestamp - prevTimestamp;
    const bitrate = Math.floor((8 * (bytesSent - prevBytesSent)) / timeDiff);
    const headerBitrate = Math.floor((8 * (headerBytesSent - prevHeaderBytesSent)) / timeDiff);
    const packetRate = Math.floor((1000 * (packetsSent - prevPacketsSent)) / timeDiff);
    console.log(`Bitrate ${bitrate}kbps, overhead ${headerBitrate}kbps, ${packetRate} packets/second, FPS ${framesPerSecond}`);
    return {
      bitrate,
      framesPerSecond,
      headerBitrate,
      packetRate,
    };
  }
};

export const getCandidate = (statsReport: RTCStatsReport, type: 'remote' | 'local'): Candidate | undefined => {
  const [, report] = Array.from(statsReport.entries()).find(([, report]) => report.type === `${type}-candidate`) || [];
  if (report) {
    const candidate = Candidate.fromJSON(report);
    console.log(`${type.toUpperCase()} is ${candidate.toString()}`);
    return candidate;
  }
};

export const updateBandwidthRestriction = (sdp: string, value: number): string => {
  let modifier = 'AS';
  if (adapter.browserDetails.browser === 'firefox') {
    value = (value >>> 0) * 1000;
    modifier = 'TIAS';
  }
  if (sdp.indexOf(`b=${modifier}:`) === -1) {
    // insert b= after c= line.
    const cRegExp = /c=IN (.*)\r\n/;
    sdp = sdp.replace(cRegExp, `c=IN $1\r\nb=${modifier}:${value}\r\n`);
  } else {
    const modifierRegExp = new RegExp(`b=${modifier}:.*\r\n`);
    sdp = sdp.replace(modifierRegExp, `b=${modifier}:${value}\r\n`);
  }
  console.log(`Applying bandwidth restriction to SDP:\n${sdp}`);
  return sdp;
};

export const setPreferredCodec = (
  preferredCodec: RTCRtpCodecCapability,
  pc: RTCPeerConnection,
  type: 'audio' | 'video',
  stream?: MediaStream
): void => {
  if (stream && setCodecPreferencesSupported) {
    const [track] = type === 'audio' ? stream?.getAudioTracks() : stream?.getVideoTracks();
    const transceiver = pc.getTransceivers().find((transceiver) => transceiver.sender.track === track);
    const { codecs: codecsWithDefaultOrder } = RTCRtpSender.getCapabilities(type)!;
    const codecIndex = codecsWithDefaultOrder.findIndex((codec) => JSON.stringify(codec) === JSON.stringify(preferredCodec));
    if (codecIndex > -1) {
      const codecsWithPreferredOrder: RTCRtpCodecCapability[] = [
        preferredCodec,
        ...codecsWithDefaultOrder.slice(0, codecIndex),
        ...codecsWithDefaultOrder.slice(codecIndex + 1),
      ];
      transceiver?.setCodecPreferences(codecsWithPreferredOrder);
    }
  }
};
