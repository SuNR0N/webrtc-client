import { Dispatch } from 'react';

import { WebRTCContextAction, WebRTCContextActionType } from '../actions/webrtc-context-action';
import { byeMessage, Candidate, candidateMessage, CandidatePair, SendSignalingMessage, WebRTCContextState } from '../models';

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

export const calculateBitrateStats = (statsReport: RTCStatsReport, latestStatsReport?: RTCStatsReport): void => {
  statsReport.forEach((report) => {
    if (report.type === 'outbound-rtp') {
      if (report.isRemote) {
        return;
      }
      const now = report.timestamp;
      const bytes = report.bytesSent;
      const headerBytes = report.headerBytesSent;

      const packets = report.packetsSent;
      if (latestStatsReport && latestStatsReport.has(report.id)) {
        // calculate bitrate
        const bitrate = Math.floor(
          (8 * (bytes - latestStatsReport.get(report.id).bytesSent)) / (now - latestStatsReport.get(report.id).timestamp)
        );
        const headerRate = Math.floor(
          (8 * (headerBytes - latestStatsReport.get(report.id).headerBytesSent)) / (now - latestStatsReport.get(report.id).timestamp)
        );

        const packetRate = Math.floor(
          (1000 * (packets - latestStatsReport.get(report.id).packetsSent)) / (now - latestStatsReport.get(report.id).timestamp)
        );
        console.log(`Bitrate ${bitrate}kbps, overhead ${headerRate}kbps, ${packetRate} packets/second`);
      }
    }
  });
};

export const getCandidatePair = (statsReport: RTCStatsReport, latestCandidatePair?: CandidatePair): CandidatePair | undefined => {
  if (latestCandidatePair) {
    return;
  }

  // Figure out the peer's ip
  let activeCandidatePair: RTCIceCandidatePairStats | undefined;
  let remoteCandidate: Candidate | undefined;
  let localCandidate: Candidate | undefined;

  // Search for the candidate pair, spec-way first.
  statsReport.forEach((report) => {
    if (report.type === 'transport') {
      activeCandidatePair = statsReport.get(report.selectedCandidatePairId);
    }
  });
  // Fallback for Firefox.
  if (!activeCandidatePair) {
    statsReport.forEach((report) => {
      if (report.type === 'candidate-pair' && report.selected) {
        activeCandidatePair = report;
      }
    });
  }

  const { localCandidateId, remoteCandidateId } = activeCandidatePair || {};
  remoteCandidate = Candidate.fromJSON(remoteCandidateId && statsReport.get(remoteCandidateId));
  localCandidate = Candidate.fromJSON(localCandidateId && statsReport.get(localCandidateId));

  if (remoteCandidate) {
    console.log('Remote is', remoteCandidate.address, remoteCandidate.port);
  }
  if (localCandidate) {
    console.log('Local is', localCandidate.address, localCandidate.port);
  }

  return {
    local: localCandidate,
    remote: remoteCandidate,
  };
};
