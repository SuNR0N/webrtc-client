import { Action, ActionWithPayload } from '../models/action';

export enum WebRTCContextActionType {
  AddICECandidate = 'AddICECandidate',
  AnswerReceived = 'AnswerReceived',
  ClosePeerConnection = 'ClosePeerConnection',
  HangUp = 'HangUp',
  InitAVStream = 'InitAVStream',
  InitAVStreamSuccess = 'InitAVStreamSuccess',
  InitiatePeerConnection = 'InitiatePeerConnection',
  MuteAudio = 'MuteAudio',
  MuteVideo = 'MuteVideo',
  OfferReceived = 'OfferReceived',
  StartScreenShare = 'StartScreenShare',
  StartScreenShareSuccess = 'StartScreenShareSuccess',
  StopScreenShare = 'StopScreenShare',
  StopScreenShareSuccess = 'StopScreenShareSuccess',
  UnmuteAudio = 'UnmuteAudio',
  UnmuteVideo = 'UnmuteVideo',
  UpdateICEServers = 'UpdateICEServers',
  UpdateLocalStream = 'UpdateLocalStream',
  UpdatePeerId = 'UpdatePeerId',
  UpdateRemoteStream = 'UpdateRemoteStream',
  UpdateSignalingSocket = 'UpdateSignalingSocket',
}

export interface AddICECandidateAction extends ActionWithPayload<{ candidate: RTCIceCandidate; id: string }> {
  type: typeof WebRTCContextActionType.AddICECandidate;
}

export interface AnswerReceivedAction extends ActionWithPayload<{ id: string; sdp: string }> {
  type: typeof WebRTCContextActionType.AnswerReceived;
}

export interface InitAVStreamAction extends Action {
  type: typeof WebRTCContextActionType.InitAVStream;
}

interface InitAVStreamSuccessAction extends ActionWithPayload<MediaStream> {
  type: typeof WebRTCContextActionType.InitAVStreamSuccess;
}

export interface InitiatePeerConnectionAction extends ActionWithPayload<string> {
  type: typeof WebRTCContextActionType.InitiatePeerConnection;
}

interface ClosePeerConnectionAction extends ActionWithPayload<string> {
  type: typeof WebRTCContextActionType.ClosePeerConnection;
}

interface HangUpAction extends Action {
  type: typeof WebRTCContextActionType.HangUp;
}

interface MuteAudioAction extends Action {
  type: typeof WebRTCContextActionType.MuteAudio;
}

interface MuteVideoAction extends Action {
  type: typeof WebRTCContextActionType.MuteVideo;
}

export interface OfferReceivedAction extends ActionWithPayload<{ id: string; sdp: string }> {
  type: typeof WebRTCContextActionType.OfferReceived;
}

export interface StartScreenShareAction extends Action {
  type: typeof WebRTCContextActionType.StartScreenShare;
}

interface StartScreenShareSuccessAction extends ActionWithPayload<MediaStream> {
  type: typeof WebRTCContextActionType.StartScreenShareSuccess;
}

export interface StopScreenShareAction extends Action {
  type: typeof WebRTCContextActionType.StopScreenShare;
}

interface StopScreenShareSuccessAction extends Action {
  type: typeof WebRTCContextActionType.StopScreenShareSuccess;
}

interface UnmuteAudioAction extends Action {
  type: typeof WebRTCContextActionType.UnmuteAudio;
}

interface UnmuteVideoAction extends Action {
  type: typeof WebRTCContextActionType.UnmuteVideo;
}

interface UpdateICEServersAction extends ActionWithPayload<RTCIceServer[]> {
  type: typeof WebRTCContextActionType.UpdateICEServers;
}

interface UpdateLocalStreamAction extends ActionWithPayload<MediaStream> {
  type: typeof WebRTCContextActionType.UpdateLocalStream;
}

interface UpdatePeerIdAction extends ActionWithPayload<string> {
  type: typeof WebRTCContextActionType.UpdatePeerId;
}

interface UpdateRemoteStreamAction extends ActionWithPayload<MediaStream> {
  type: typeof WebRTCContextActionType.UpdateRemoteStream;
}

interface UpdateSignalingSocketAction extends ActionWithPayload<WebSocket> {
  type: typeof WebRTCContextActionType.UpdateSignalingSocket;
}

export type AsyncWebRTCContextAction =
  | AddICECandidateAction
  | AnswerReceivedAction
  | InitAVStreamAction
  | InitiatePeerConnectionAction
  | OfferReceivedAction
  | StartScreenShareAction
  | StopScreenShareAction;

export type WebRTCContextAction =
  | ClosePeerConnectionAction
  | HangUpAction
  | InitAVStreamSuccessAction
  | MuteAudioAction
  | MuteVideoAction
  | StartScreenShareSuccessAction
  | StopScreenShareSuccessAction
  | UnmuteAudioAction
  | UnmuteVideoAction
  | UpdateICEServersAction
  | UpdateLocalStreamAction
  | UpdatePeerIdAction
  | UpdateRemoteStreamAction
  | UpdateSignalingSocketAction;
