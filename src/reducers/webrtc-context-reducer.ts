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

export interface State {
  audioMuted: boolean;
  avStream?: MediaStream;
  iceServers?: RTCIceServer[];
  localStream?: MediaStream;
  peerId?: string;
  peers: Map<string, RTCPeerConnection>;
  remoteStream?: MediaStream;
  screenShare?: MediaStream;
  signalingSocket?: WebSocket;
  videoMuted: boolean;
}

export const initialState: State = {
  audioMuted: false,
  avStream: undefined,
  iceServers: undefined,
  localStream: undefined,
  peerId: undefined,
  peers: new Map(),
  remoteStream: undefined,
  screenShare: undefined,
  signalingSocket: undefined,
  videoMuted: false,
};

const createPeerConnection = (
  id: string,
  dispatch: Dispatch<WebRTCContextAction>,
  iceServers?: RTCIceServer[],
  signalingSocket?: WebSocket
): RTCPeerConnection => {
  const pc = new RTCPeerConnection({ iceServers });
  pc.addEventListener('icecandidate', ({ candidate }) => {
    signalingSocket?.send(
      JSON.stringify({
        type: 'candidate',
        payload: {
          id,
          candidate,
        },
      })
    );
  });
  pc.addEventListener('track', ({ streams }) => {
    dispatch({ type: WebRTCContextActionType.UpdateRemoteStream, payload: streams[0] });
  });
  pc.addEventListener('iceconnectionstatechange', () => {
    console.log(id, 'iceconnectionstatechange', pc.iceConnectionState);
  });
  pc.addEventListener('connectionstatechange', () => {
    console.log(id, 'connectionstatechange', pc.connectionState);
  });
  pc.addEventListener('signalingstatechange', () => {
    console.log(id, 'signalingstatechange', pc.signalingState);
  });

  return pc;
};

const hangUp = (id: string, peers: Map<string, RTCPeerConnection>, signalingSocket?: WebSocket) => {
  const peer = peers.get(id);
  if (!peer) {
    console.log(`Peer with id '${id}' does not exist`);
    return;
  }

  peer.close();
  peers.delete(id);

  // Tell the other side
  signalingSocket?.send(
    JSON.stringify({
      type: 'bye',
      payload: {
        id,
      },
    })
  );
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
  const { iceServers, localStream, peers, signalingSocket } = getState();
  if (peers.has(id)) {
    console.log(`You are already in a call with: ${id}`);
    return;
  }
  const pc = createPeerConnection(id, dispatch, iceServers, signalingSocket);
  peers.set(id, pc);
  dispatch({ type: WebRTCContextActionType.UpdatePeerId, payload: id });
  if (localStream) {
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
  }
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  signalingSocket?.send(
    JSON.stringify({
      type: 'offer',
      payload: {
        id,
        sdp: offer.sdp,
      },
    })
  );
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
  const { peers, peerId, signalingSocket } = state;
  if (peerId) {
    peers.forEach((_peer, id) => {
      hangUp(id, peers, signalingSocket);
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
  const { iceServers, localStream, peers, signalingSocket } = getState();
  if (!peers.has(id)) {
    console.log(`Incoming call from: ${id}`);
    if (peers.size >= 1) {
      // Already in a call. Reject.
      console.log('Already in a call, rejecting');
      signalingSocket?.send(
        JSON.stringify({
          type: 'bye',
          payload: id,
        })
      );
      return;
    }
    const pc = createPeerConnection(id, dispatch, iceServers, signalingSocket);
    peers.set(id, pc);
    dispatch({ type: WebRTCContextActionType.UpdatePeerId, payload: id });
    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    }
    await pc.setRemoteDescription({ type: 'offer', sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    signalingSocket?.send(
      JSON.stringify({
        type: 'answer',
        payload: {
          id,
          sdp: answer.sdp,
        },
      })
    );
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

const handleUpdateSignalingSocket = (state: State, signalingSocket: WebSocket): State => ({
  ...state,
  signalingSocket,
});

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
    case WebRTCContextActionType.UpdateSignalingSocket:
      return handleUpdateSignalingSocket(state, action.payload);
    default:
      return state;
  }
};
