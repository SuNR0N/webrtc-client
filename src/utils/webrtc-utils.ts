import { Dispatch } from 'react';
import adapter from 'webrtc-adapter';

import { WebRTCContextAction, WebRTCContextActionType } from '../actions/webrtc-context-action';
import { byeMessage, Candidate, candidateMessage, RateStatistics, SendSignalingMessage, WebRTCContextState } from '../models';

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

  const intervalId = setInterval(async () => {
    if (pc.signalingState === 'closed') {
      clearInterval(intervalId);
      return;
    }
    const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
    const statsReport = await sender?.getStats();
    if (statsReport) {
      dispatch({ type: WebRTCContextActionType.UpdateStatsReport, payload: statsReport });
    }
  }, state.queryStatsInterval);

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

export const calculateBitrateStats = (statsReport: RTCStatsReport, latestStatsReport?: RTCStatsReport): RateStatistics | undefined => {
  const [, report] = Array.from(statsReport.entries()).find(([, report]) => report.type === 'outbound-rtp' && !report.isRemote) || [];
  const previousReport = latestStatsReport?.get(report?.id);
  if (report && previousReport) {
    const { timestamp, bytesSent, headerBytesSent, packetsSent } = report;
    const {
      timestamp: prevTimestamp,
      bytesSent: prevBytesSent,
      headerBytesSent: prevHeaderBytesSent,
      packetsSent: prevPacketsSent,
    } = previousReport;
    // calculate bitrate
    const timeDiff = timestamp - prevTimestamp;
    const bitrate = Math.floor((8 * (bytesSent - prevBytesSent)) / timeDiff);
    const headerBitrate = Math.floor((8 * (headerBytesSent - prevHeaderBytesSent)) / timeDiff);
    const packetRate = Math.floor((1000 * (packetsSent - prevPacketsSent)) / timeDiff);
    console.log(`Bitrate ${bitrate}kbps, overhead ${headerBitrate}kbps, ${packetRate} packets/second`);
    return {
      bitrate,
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
