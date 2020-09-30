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
import { answerMessage, byeMessage, offerMessage, SendSignalingMessage, WebRTCContextState } from '../models';
import { calculateBitrateStats, createPeerConnection, getCandidatePair, hangUp, replaceVideoTrack } from '../utils/webrtc-utils';

export const initialState: WebRTCContextState = {
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

interface AsyncActionHandler<A> {
  (action: A): Promise<void>;
}

interface ReducerMiddleware<A> {
  ({ dispatch, getState }: { dispatch: Dispatch<WebRTCContextAction>; getState: () => WebRTCContextState }): AsyncActionHandler<A>;
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

const handleInitAVStreamSuccess = (state: WebRTCContextState, stream: MediaStream): WebRTCContextState => ({
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

const handleClosePeerConnection = (state: WebRTCContextState, id: string): WebRTCContextState => {
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

const handleHangUp = (state: WebRTCContextState): WebRTCContextState => {
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

const handleMuteAudio = (state: WebRTCContextState): WebRTCContextState => {
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

const handleMuteVideo = (state: WebRTCContextState): WebRTCContextState => {
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

const handleStartScreenShareSuccess = (state: WebRTCContextState, stream: MediaStream): WebRTCContextState => ({
  ...state,
  screenShare: stream,
});

const handleStopScreenShare: ReducerMiddleware<StopScreenShareAction> = ({ dispatch, getState }) => async () => {
  const { screenShare } = getState();
  screenShare?.getTracks().forEach((t) => t.stop());
  dispatch({ type: WebRTCContextActionType.StopScreenShareSuccess });
};

const handleStopScreenShareSuccess = (state: WebRTCContextState): WebRTCContextState => {
  const { avStream, peers } = state;
  const track = avStream?.getVideoTracks()[0];
  replaceVideoTrack(peers, track);

  return {
    ...state,
    localStream: avStream,
    screenShare: undefined,
  };
};

const handleUnmuteAudio = (state: WebRTCContextState): WebRTCContextState => {
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

const handleUnmuteVideo = (state: WebRTCContextState): WebRTCContextState => {
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

const handleUpdateICEServers = (state: WebRTCContextState, iceServers: RTCIceServer[]): WebRTCContextState => ({
  ...state,
  iceServers,
});

const handleUpdateLocalStream = (state: WebRTCContextState, stream: MediaStream): WebRTCContextState => ({
  ...state,
  localStream: stream,
});

const handleUpdatePeerId = (state: WebRTCContextState, id: string): WebRTCContextState => ({
  ...state,
  peerId: id,
});

const handleUpdateRemoteStream = (state: WebRTCContextState, stream: MediaStream): WebRTCContextState => ({
  ...state,
  remoteStream: stream,
});

const handleUpdateSendSignalingMessage = (state: WebRTCContextState, sendSignalingMessage: SendSignalingMessage): WebRTCContextState => ({
  ...state,
  sendSignalingMessage,
});

const handleUpdateStatsReport = (state: WebRTCContextState, statsReport: RTCStatsReport): WebRTCContextState => {
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

export const asyncActionHandlers: AsyncActionHandlers<Reducer<WebRTCContextState, WebRTCContextAction>, AsyncWebRTCContextAction> = {
  AddICECandidate: handleAddICECandidate,
  AnswerReceived: handleAnswerReceived,
  InitAVStream: handleInitAVStream,
  InitiatePeerConnection: handleInitiatePeerConnection,
  OfferReceived: handleOfferReceived,
  StartScreenShare: handleStartScreenShare,
  StopScreenShare: handleStopScreenShare,
};

export const reducer = (state: WebRTCContextState, action: WebRTCContextAction): WebRTCContextState => {
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
