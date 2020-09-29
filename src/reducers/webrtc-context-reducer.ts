import { Dispatch, Reducer } from 'react';
import { AsyncActionHandlers } from 'use-reducer-async';

import {
  AddICECandidateAction,
  AnswerReceivedAction,
  AsyncWebRTCContextAction,
  InitAVStreamAction,
  InitiatePeerConnectionAction,
  OfferReceivedAction,
  StartScreenShareAction,
  StopScreenShareAction,
  WebRTCContextAction,
  WebRTCContextActionType,
} from '../actions/webrtc-context-action';
import {
  answerMessage,
  byeMessage,
  Candidate,
  candidateMessage,
  CandidatePair,
  offerMessage,
  SendSignalingMessage,
  SignalingMessage,
} from '../models';

export interface State {
  audioMuted: boolean;
  avStream?: MediaStream;
  iceServers?: RTCIceServer[];
  latestCandidatePair?: CandidatePair;
  latestStatsReport?: RTCStatsReport;
  localStream?: MediaStream;
  peerId?: string;
  peers: Map<string, RTCPeerConnection>;
  queryStatsInterval: number;
  remoteStream?: MediaStream;
  screenShare?: MediaStream;
  sendSignalingMessage: SendSignalingMessage;
  videoMuted: boolean;
}

export const initialState: State = {
  audioMuted: false,
  avStream: undefined,
  iceServers: undefined,
  latestCandidatePair: undefined,
  latestStatsReport: undefined,
  localStream: undefined,
  peerId: undefined,
  peers: new Map(),
  queryStatsInterval: 2000,
  remoteStream: undefined,
  screenShare: undefined,
  sendSignalingMessage: () => {},
  videoMuted: false,
};

const createPeerConnection = (
  id: string,
  state: State,
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

const hangUp = (id: string, peers: Map<string, RTCPeerConnection>, sendMessage: (message: SignalingMessage) => void) => {
  const peer = peers.get(id);
  if (!peer) {
    console.log(`Peer with id '${id}' does not exist`);
    return;
  }

  peer.close();
  peers.delete(id);

  // Tell the other side
  sendMessage(byeMessage({ id }));
};

const replaceVideoTrack = (peers: Map<string, RTCPeerConnection>, withTrack?: MediaStreamTrack) => {
  if (withTrack) {
    peers.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(withTrack);
      }
    });
  }
};

const calculateBitrateStats = (statsReport: RTCStatsReport, latestStatsReport?: RTCStatsReport): void => {
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

const getCandidatePair = (statsReport: RTCStatsReport, latestCandidatePair?: CandidatePair): CandidatePair | undefined => {
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

interface AsyncActionHandler<A> {
  (action: A): Promise<void>;
}

interface ReducerMiddleware<A> {
  ({ dispatch, getState }: { dispatch: Dispatch<WebRTCContextAction>; getState: () => State }): AsyncActionHandler<A>;
}

const handleAddICECandidate: ReducerMiddleware<AddICECandidateAction> = ({ getState }) => async ({ payload: { candidate, id } }) => {
  const { peers } = getState();
  const peer = peers.get(id);
  if (!peer) {
    console.log(`Peer not found with id: ${id}`);
  } else if (candidate) {
    console.log('addIceCandidate', id, candidate);
    await peer.addIceCandidate(candidate);
  }
};

const handleAnswerReceived: ReducerMiddleware<AnswerReceivedAction> = ({ getState }) => async ({ payload: { id, sdp } }) => {
  const { peers } = getState();
  const peer = peers.get(id);
  if (!peer) {
    console.log(`Peer not found with id: ${id}`);
  } else {
    await peer.setRemoteDescription({
      type: 'answer',
      sdp,
    });
  }
};

const handleInitAVStream: ReducerMiddleware<InitAVStreamAction> = ({ dispatch }) => async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  dispatch({ type: WebRTCContextActionType.InitAVStreamSuccess, payload: stream });
};

const handleInitAVStreamSuccess = (state: State, stream: MediaStream): State => ({
  ...state,
  avStream: stream,
  localStream: stream,
});

const handleInitiatePeerConnection: ReducerMiddleware<InitiatePeerConnectionAction> = ({ dispatch, getState }) => async ({
  payload: id,
}) => {
  const state = getState();
  const { iceServers, localStream, peers, sendSignalingMessage } = state;
  if (peers.has(id)) {
    console.log(`You are already in a call with: ${id}`);
    return;
  }
  const pc = createPeerConnection(id, state, dispatch, sendSignalingMessage, iceServers);
  peers.set(id, pc);
  dispatch({ type: WebRTCContextActionType.UpdatePeerId, payload: id });
  if (localStream) {
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
  }
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  sendSignalingMessage(offerMessage({ id, sdp: offer.sdp! }));
};

const handleClosePeerConnection = (state: State, id: string): State => {
  const { peers } = state;
  const peer = peers.get(id);

  if (!peer) {
    console.log(`Peer not found with id: ${id}`);
  } else {
    peer.close();
    peers.delete(id);
  }

  return state;
};

const handleHangUp = (state: State): State => {
  const { peers, peerId, sendSignalingMessage } = state;
  if (peerId) {
    peers.forEach((_peer, id) => {
      hangUp(id, peers, sendSignalingMessage);
    });
  }

  return {
    ...state,
    peerId: undefined,
    remoteStream: undefined,
  };
};

const handleMuteAudio = (state: State): State => {
  const { localStream } = state;
  const audioTrack = localStream?.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = false;
  }

  return {
    ...state,
    audioMuted: true,
  };
};

const handleMuteVideo = (state: State): State => {
  const { localStream } = state;
  const videoTrack = localStream?.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = false;
    // The advanced version of this stops the track to disable and uses
    // replaceTrack to re-enable. Not necessary in Firefox which turns
    // off the camera light.
  }

  return {
    ...state,
    videoMuted: true,
  };
};

const handleOfferReceived: ReducerMiddleware<OfferReceivedAction> = ({ dispatch, getState }) => async ({ payload: { id, sdp } }) => {
  const state = getState();
  const { iceServers, localStream, peers, sendSignalingMessage } = state;
  if (!peers.has(id)) {
    console.log(`Incoming call from: ${id}`);
    if (peers.size >= 1) {
      // Already in a call. Reject.
      console.log('Already in a call, rejecting');
      sendSignalingMessage(byeMessage({ id }));
      return;
    }
    const pc = createPeerConnection(id, state, dispatch, sendSignalingMessage, iceServers);
    peers.set(id, pc);
    dispatch({ type: WebRTCContextActionType.UpdatePeerId, payload: id });
    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    }
    await pc.setRemoteDescription({ type: 'offer', sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendSignalingMessage(answerMessage({ id, sdp: answer.sdp! }));
  } else {
    console.log('Subsequent offer not implemented');
  }
};

const handleStartScreenShare: ReducerMiddleware<StartScreenShareAction> = ({ dispatch, getState }) => async () => {
  const { peers } = getState();
  const stream: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
  const [track] = stream.getVideoTracks();
  replaceVideoTrack(peers, track);
  dispatch({ type: WebRTCContextActionType.UpdateLocalStream, payload: stream });
  track.addEventListener('ended', () => {
    console.log('Screensharing ended via the browser UI');
    dispatch({ type: WebRTCContextActionType.StopScreenShareSuccess });
  });
  dispatch({ type: WebRTCContextActionType.StartScreenShareSuccess, payload: stream });
};

const handleStartScreenShareSuccess = (state: State, stream: MediaStream): State => ({
  ...state,
  screenShare: stream,
});

const handleStopScreenShare: ReducerMiddleware<StopScreenShareAction> = ({ dispatch, getState }) => async () => {
  const { screenShare } = getState();
  screenShare?.getTracks().forEach((t) => t.stop());
  dispatch({ type: WebRTCContextActionType.StopScreenShareSuccess });
};

const handleStopScreenShareSuccess = (state: State): State => {
  const { avStream, peers } = state;
  const track = avStream?.getVideoTracks()[0];
  replaceVideoTrack(peers, track);

  return {
    ...state,
    localStream: avStream,
    screenShare: undefined,
  };
};

const handleUnmuteAudio = (state: State): State => {
  const { localStream } = state;
  const audioTrack = localStream?.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = true;
  }

  return {
    ...state,
    audioMuted: false,
  };
};

const handleUnmuteVideo = (state: State): State => {
  const { localStream } = state;
  const videoTrack = localStream?.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = true;
    // The advanced version of this stops the track to disable and uses
    // replaceTrack to re-enable. Not necessary in Firefox which turns
    // off the camera light.
  }

  return {
    ...state,
    videoMuted: false,
  };
};

const handleUpdateICEServers = (state: State, iceServers: RTCIceServer[]): State => ({
  ...state,
  iceServers,
});

const handleUpdateLocalStream = (state: State, stream: MediaStream): State => ({
  ...state,
  localStream: stream,
});

const handleUpdatePeerId = (state: State, id: string): State => ({
  ...state,
  peerId: id,
});

const handleUpdateRemoteStream = (state: State, stream: MediaStream): State => ({
  ...state,
  remoteStream: stream,
});

const handleUpdateSendSignalingMessage = (state: State, sendSignalingMessage: SendSignalingMessage): State => ({
  ...state,
  sendSignalingMessage,
});

const handleUpdateStatsReport = (state: State, statsReport: RTCStatsReport): State => {
  const { latestCandidatePair, latestStatsReport } = state;
  calculateBitrateStats(statsReport, latestStatsReport);
  const candidatePair = getCandidatePair(statsReport, latestCandidatePair);

  return {
    ...state,
    latestStatsReport: statsReport,
    ...(candidatePair && {
      latestCandidatePair: candidatePair,
    }),
  };
};

export const asyncActionHandlers: AsyncActionHandlers<Reducer<State, WebRTCContextAction>, AsyncWebRTCContextAction> = {
  AddICECandidate: handleAddICECandidate,
  AnswerReceived: handleAnswerReceived,
  InitAVStream: handleInitAVStream,
  InitiatePeerConnection: handleInitiatePeerConnection,
  OfferReceived: handleOfferReceived,
  StartScreenShare: handleStartScreenShare,
  StopScreenShare: handleStopScreenShare,
};

export const reducer = (state: State, action: WebRTCContextAction): State => {
  switch (action.type) {
    case WebRTCContextActionType.ClosePeerConnection:
      return handleClosePeerConnection(state, action.payload);
    case WebRTCContextActionType.HangUp:
      return handleHangUp(state);
    case WebRTCContextActionType.InitAVStreamSuccess:
      return handleInitAVStreamSuccess(state, action.payload);
    case WebRTCContextActionType.MuteAudio:
      return handleMuteAudio(state);
    case WebRTCContextActionType.MuteVideo:
      return handleMuteVideo(state);
    case WebRTCContextActionType.StartScreenShareSuccess:
      return handleStartScreenShareSuccess(state, action.payload);
    case WebRTCContextActionType.StopScreenShareSuccess:
      return handleStopScreenShareSuccess(state);
    case WebRTCContextActionType.UnmuteAudio:
      return handleUnmuteAudio(state);
    case WebRTCContextActionType.UnmuteVideo:
      return handleUnmuteVideo(state);
    case WebRTCContextActionType.UpdateICEServers:
      return handleUpdateICEServers(state, action.payload);
    case WebRTCContextActionType.UpdateLocalStream:
      return handleUpdateLocalStream(state, action.payload);
    case WebRTCContextActionType.UpdatePeerId:
      return handleUpdatePeerId(state, action.payload);
    case WebRTCContextActionType.UpdateRemoteStream:
      return handleUpdateRemoteStream(state, action.payload);
    case WebRTCContextActionType.UpdateSendSignalingMessage:
      return handleUpdateSendSignalingMessage(state, action.payload);
    case WebRTCContextActionType.UpdateStatsReport:
      return handleUpdateStatsReport(state, action.payload);
    default:
      return state;
  }
};
