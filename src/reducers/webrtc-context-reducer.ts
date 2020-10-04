import { Dispatch, Reducer } from 'react';
import { AsyncActionHandlers } from 'use-reducer-async';

import {
  AcceptOfferAction,
  AddICECandidateAction,
  AnswerReceivedAction,
  AsyncWebRTCContextAction,
  ClosePeerConnectionPayload,
  DeclineOfferAction,
  InitAVStreamAction,
  InitiatePeerConnectionAction,
  OfferReceivedAction,
  StartScreenShareAction,
  StopScreenShareAction,
  UpdateMaximumBitrateAction,
  WebRTCContextAction,
  WebRTCContextActionType,
} from '../actions/webrtc-context-action';
import { answerMessage, byeMessage, Offer, offerMessage, SendSignalingMessage, WebRTCContextState } from '../models';
import {
  calculateRemoteInboundStatistics,
  calculateOutboundStatistics,
  createPeerConnection,
  getCandidate,
  hangUp,
  replaceVideoTrack,
  setParametersSupported,
  setPreferredCodec,
  updateBandwidthRestriction,
} from '../utils/webrtc-utils';

export const initialState: WebRTCContextState = {
  audioCodec: undefined,
  audioMuted: false,
  avStream: undefined,
  iceServers: undefined,
  latestStatsReport: undefined,
  localStream: undefined,
  maximumBitrate: 0,
  maximumBitrateChangeInProgress: false,
  peerId: undefined,
  peers: new Map(),
  pendingOffers: [],
  queryStatsInterval: 2000,
  remoteStream: undefined,
  screenShare: undefined,
  sendSignalingMessage: () => {},
  statistics: {},
  videoCodec: undefined,
  videoMuted: false,
};

interface AsyncActionHandler<A> {
  (action: A): Promise<void>;
}

interface ReducerMiddleware<A> {
  ({ dispatch, getState }: { dispatch: Dispatch<WebRTCContextAction>; getState: () => WebRTCContextState }): AsyncActionHandler<A>;
}

const handleAcceptOffer: ReducerMiddleware<AcceptOfferAction> = ({ dispatch, getState }) => async ({ payload: id }) => {
  const state = getState();
  const { iceServers, localStream, peers, pendingOffers, sendSignalingMessage } = state;
  const offer = pendingOffers.find((o) => o.id === id);
  const pc = createPeerConnection(id, state, dispatch, sendSignalingMessage, iceServers);
  peers.set(id, pc);
  dispatch({ type: WebRTCContextActionType.UpdatePeerId, payload: id });
  if (localStream) {
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
  }
  await pc.setRemoteDescription({ type: 'offer', sdp: offer?.sdp });
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  sendSignalingMessage(answerMessage({ id, sdp: answer.sdp! }));
  dispatch({ type: WebRTCContextActionType.RemovePendingOffer, payload: id });
};

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

const handleAddPendingOffer = (state: WebRTCContextState, offer: Offer): WebRTCContextState => ({
  ...state,
  pendingOffers: [...state.pendingOffers, offer],
});

const handleAnswerReceived: ReducerMiddleware<AnswerReceivedAction> = ({ getState }) => async ({ payload: { id, sdp } }) => {
  const { maximumBitrate, peers } = getState();
  const peer = peers.get(id);
  if (!peer) {
    console.log(`Peer not found with id: ${id}`);
  } else {
    const remoteDescription: RTCSessionDescriptionInit = {
      type: 'answer',
      // TODO: Investigate why this does not work as expected
      sdp: maximumBitrate ? updateBandwidthRestriction(sdp, maximumBitrate) : sdp,
    };
    await peer.setRemoteDescription(remoteDescription);
  }
};

const handleDeclineOffer: ReducerMiddleware<DeclineOfferAction> = ({ dispatch, getState }) => async ({ payload: id }) => {
  const { sendSignalingMessage } = getState();
  sendSignalingMessage(byeMessage({ id }));
  dispatch({ type: WebRTCContextActionType.RemovePendingOffer, payload: id });
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
  const { audioCodec, iceServers, localStream, peers, sendSignalingMessage, videoCodec } = state;
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
  if (audioCodec) {
    setPreferredCodec(audioCodec, pc, 'audio', localStream);
  }
  if (videoCodec) {
    setPreferredCodec(videoCodec, pc, 'video', localStream);
  }
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  sendSignalingMessage(offerMessage({ id, sdp: offer.sdp! }));
};

const handleClosePeerConnection = (state: WebRTCContextState, { id, error }: ClosePeerConnectionPayload): WebRTCContextState => {
  const { peers } = state;
  const peer = peers.get(id);

  if (error) {
    console.log(`Peer connection closed. Reason: ${error}`);
  }

  if (!peer) {
    console.log(`Peer not found with id: ${id}`);
  } else {
    peer.close();
    peers.delete(id);
  }

  return {
    ...state,
    peerId: undefined,
    remoteStream: undefined,
    statistics: {},
  };
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
    statistics: {},
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
  const { peers, sendSignalingMessage } = state;
  if (!peers.has(id)) {
    console.log(`Incoming call from: ${id}`);
    if (peers.size >= 1) {
      // Already in a call. Reject.
      console.log('Already in a call, rejecting');
      sendSignalingMessage(byeMessage({ id }));
      return;
    }
    dispatch({ type: WebRTCContextActionType.AddPendingOffer, payload: { id, sdp } });
  } else {
    console.log('Subsequent offer not implemented');
  }
};

const handleRemovePendingOffer = (state: WebRTCContextState, id: string): WebRTCContextState => {
  const { pendingOffers } = state;
  const indexToRemove = pendingOffers.findIndex((pendingOffer) => pendingOffer.id === id);
  const updatedPendingOffers = [...pendingOffers.slice(0, indexToRemove), ...pendingOffers.slice(indexToRemove + 1)];

  return {
    ...state,
    ...(indexToRemove > -1 && {
      pendingOffers: updatedPendingOffers,
    }),
  };
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

const handleUpdateAudioCodec = (state: WebRTCContextState, codec?: RTCRtpCodecCapability): WebRTCContextState => ({
  ...state,
  audioCodec: codec,
});

const handleUpdateICEServers = (state: WebRTCContextState, iceServers: RTCIceServer[]): WebRTCContextState => ({
  ...state,
  iceServers,
});

const handleUpdateLocalStream = (state: WebRTCContextState, stream: MediaStream): WebRTCContextState => ({
  ...state,
  localStream: stream,
});

const handleUpdateMaximumBitrate: ReducerMiddleware<UpdateMaximumBitrateAction> = ({ dispatch, getState }) => async ({
  payload: value,
}) => {
  const { peers } = getState();
  if (setParametersSupported) {
    peers.forEach(async (peer) => {
      const sender = peer.getSenders().find((s) => s.track?.kind === 'video');
      if (!sender) {
        return;
      }
      const parameters = sender.getParameters();
      // Firefox workaround
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      if (value === 0) {
        delete parameters.encodings[0].maxBitrate;
      } else {
        parameters.encodings[0].maxBitrate = value * 1000;
      }

      dispatch({ type: WebRTCContextActionType.UpdateMaximumBitrateStarted });
      try {
        await sender.setParameters(parameters);
      } catch (err) {
        console.log('An error has occurred while trying to update the parameters of RTCRtpSender', err);
      }
    });
  } else {
    console.log('Dynamic update of RTCRtpSender parameters is not supported');
  }
  dispatch({ type: WebRTCContextActionType.UpdateMaximumBitrateSuccess, payload: value });
};

const handleUpdateMaximumBitrateStarted = (state: WebRTCContextState): WebRTCContextState => ({
  ...state,
  maximumBitrateChangeInProgress: true,
});

const handleUpdateMaximumBitrateSuccess = (state: WebRTCContextState, value: number): WebRTCContextState => ({
  ...state,
  maximumBitrateChangeInProgress: false,
  maximumBitrate: value,
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
  console.log(
    Array.from(statsReport.entries()).reduce((acc, [key, report]) => {
      acc[key] = report;
      return acc;
    }, {} as { [key: string]: any })
  );
  const { latestStatsReport, statistics } = state;
  const outboundStatistics = calculateOutboundStatistics(statsReport, latestStatsReport);
  const remoteInboundStatistics = calculateRemoteInboundStatistics(statsReport);
  const localCandidate = statistics.localCandidate || getCandidate(statsReport, 'local');
  const remoteCandidate = statistics.remoteCandidate || getCandidate(statsReport, 'remote');

  return {
    ...state,
    latestStatsReport: statsReport,
    statistics: {
      ...state.statistics,
      ...(outboundStatistics && {
        ...outboundStatistics,
      }),
      ...(remoteInboundStatistics && {
        ...remoteInboundStatistics,
      }),
      localCandidate,
      remoteCandidate,
    },
  };
};

const handleUpdateVideoCodec = (state: WebRTCContextState, codec?: RTCRtpCodecCapability): WebRTCContextState => ({
  ...state,
  videoCodec: codec,
});

export const asyncActionHandlers: AsyncActionHandlers<Reducer<WebRTCContextState, WebRTCContextAction>, AsyncWebRTCContextAction> = {
  AcceptOffer: handleAcceptOffer,
  AddICECandidate: handleAddICECandidate,
  AnswerReceived: handleAnswerReceived,
  DeclineOffer: handleDeclineOffer,
  InitAVStream: handleInitAVStream,
  InitiatePeerConnection: handleInitiatePeerConnection,
  OfferReceived: handleOfferReceived,
  StartScreenShare: handleStartScreenShare,
  StopScreenShare: handleStopScreenShare,
  UpdateMaximumBitrate: handleUpdateMaximumBitrate,
};

export const reducer = (state: WebRTCContextState, action: WebRTCContextAction): WebRTCContextState => {
  switch (action.type) {
    case WebRTCContextActionType.AddPendingOffer:
      return handleAddPendingOffer(state, action.payload);
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
    case WebRTCContextActionType.RemovePendingOffer:
      return handleRemovePendingOffer(state, action.payload);
    case WebRTCContextActionType.StartScreenShareSuccess:
      return handleStartScreenShareSuccess(state, action.payload);
    case WebRTCContextActionType.StopScreenShareSuccess:
      return handleStopScreenShareSuccess(state);
    case WebRTCContextActionType.UnmuteAudio:
      return handleUnmuteAudio(state);
    case WebRTCContextActionType.UnmuteVideo:
      return handleUnmuteVideo(state);
    case WebRTCContextActionType.UpdateAudioCodec:
      return handleUpdateAudioCodec(state, action.payload);
    case WebRTCContextActionType.UpdateICEServers:
      return handleUpdateICEServers(state, action.payload);
    case WebRTCContextActionType.UpdateLocalStream:
      return handleUpdateLocalStream(state, action.payload);
    case WebRTCContextActionType.UpdateMaximumBitrateStarted:
      return handleUpdateMaximumBitrateStarted(state);
    case WebRTCContextActionType.UpdateMaximumBitrateSuccess:
      return handleUpdateMaximumBitrateSuccess(state, action.payload);
    case WebRTCContextActionType.UpdatePeerId:
      return handleUpdatePeerId(state, action.payload);
    case WebRTCContextActionType.UpdateRemoteStream:
      return handleUpdateRemoteStream(state, action.payload);
    case WebRTCContextActionType.UpdateSendSignalingMessage:
      return handleUpdateSendSignalingMessage(state, action.payload);
    case WebRTCContextActionType.UpdateStatsReport:
      return handleUpdateStatsReport(state, action.payload);
    case WebRTCContextActionType.UpdateVideoCodec:
      return handleUpdateVideoCodec(state, action.payload);
    default:
      return state;
  }
};
