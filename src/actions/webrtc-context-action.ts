import { Action, ActionWithPayload, Offer, SendSignalingMessage } from '../models';

export enum WebRTCContextActionType {
  AcceptOffer = 'AcceptOffer',
  AddICECandidate = 'AddICECandidate',
  AddPendingOffer = 'AddPendingOffer',
  AnswerReceived = 'AnswerReceived',
  ClosePeerConnection = 'ClosePeerConnection',
  DeclineOffer = 'DeclineOffer',
  HangUp = 'HangUp',
  InitAVStream = 'InitAVStream',
  InitAVStreamSuccess = 'InitAVStreamSuccess',
  InitiatePeerConnection = 'InitiatePeerConnection',
  MuteAudio = 'MuteAudio',
  MuteVideo = 'MuteVideo',
  OfferReceived = 'OfferReceived',
  RemovePendingOffer = 'RemovePendingOffer',
  StartScreenShare = 'StartScreenShare',
  StartScreenShareSuccess = 'StartScreenShareSuccess',
  StopScreenShare = 'StopScreenShare',
  StopScreenShareSuccess = 'StopScreenShareSuccess',
  UnmuteAudio = 'UnmuteAudio',
  UnmuteVideo = 'UnmuteVideo',
  UpdateICEServers = 'UpdateICEServers',
  UpdateLocalStream = 'UpdateLocalStream',
  UpdateMaximumBitrate = 'UpdateMaximumBitrate',
  UpdateMaximumBitrateStarted = 'UpdateMaximumBitrateStarted',
  UpdateMaximumBitrateSuccess = 'UpdateMaximumBitrateSuccess',
  UpdatePeerId = 'UpdatePeerId',
  UpdateRemoteStream = 'UpdateRemoteStream',
  UpdateSendSignalingMessage = 'UpdateSendSignalingMessage',
  UpdateStatsReport = 'UpdateStatsReport',
}

interface IdPayload {
  id: string;
}

interface SDPPayload extends IdPayload {
  sdp: string;
}

interface ICECandidatePayload extends IdPayload {
  candidate: RTCIceCandidate;
}

export interface ClosePeerConnectionPayload extends IdPayload {
  error?: string;
}

export interface AcceptOfferAction extends ActionWithPayload<string> {
  type: typeof WebRTCContextActionType.AcceptOffer;
}

export interface AddICECandidateAction extends ActionWithPayload<ICECandidatePayload> {
  type: typeof WebRTCContextActionType.AddICECandidate;
}

interface AddPendingOfferAction extends ActionWithPayload<Offer> {
  type: typeof WebRTCContextActionType.AddPendingOffer;
}

export interface AnswerReceivedAction extends ActionWithPayload<SDPPayload> {
  type: typeof WebRTCContextActionType.AnswerReceived;
}

export interface DeclineOfferAction extends ActionWithPayload<string> {
  type: typeof WebRTCContextActionType.DeclineOffer;
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

interface ClosePeerConnectionAction extends ActionWithPayload<ClosePeerConnectionPayload> {
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

export interface OfferReceivedAction extends ActionWithPayload<SDPPayload> {
  type: typeof WebRTCContextActionType.OfferReceived;
}

interface RemovePendingOfferAction extends ActionWithPayload<string> {
  type: typeof WebRTCContextActionType.RemovePendingOffer;
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

export interface UpdateMaximumBitrateAction extends ActionWithPayload<number> {
  type: typeof WebRTCContextActionType.UpdateMaximumBitrate;
}

interface UpdateMaximumBitrateStartedAction extends Action {
  type: typeof WebRTCContextActionType.UpdateMaximumBitrateStarted;
}

interface UpdateMaximumBitrateSuccessAction extends ActionWithPayload<number> {
  type: typeof WebRTCContextActionType.UpdateMaximumBitrateSuccess;
}

interface UpdatePeerIdAction extends ActionWithPayload<string> {
  type: typeof WebRTCContextActionType.UpdatePeerId;
}

interface UpdateRemoteStreamAction extends ActionWithPayload<MediaStream> {
  type: typeof WebRTCContextActionType.UpdateRemoteStream;
}

interface UpdateSendSignalingMessageAction extends ActionWithPayload<SendSignalingMessage> {
  type: typeof WebRTCContextActionType.UpdateSendSignalingMessage;
}

interface UpdateStatsReportAction extends ActionWithPayload<RTCStatsReport> {
  type: typeof WebRTCContextActionType.UpdateStatsReport;
}

export type AsyncWebRTCContextAction =
  | AcceptOfferAction
  | AddICECandidateAction
  | AnswerReceivedAction
  | DeclineOfferAction
  | InitAVStreamAction
  | InitiatePeerConnectionAction
  | OfferReceivedAction
  | StartScreenShareAction
  | StopScreenShareAction
  | UpdateMaximumBitrateAction;

export type WebRTCContextAction =
  | AddPendingOfferAction
  | ClosePeerConnectionAction
  | HangUpAction
  | InitAVStreamSuccessAction
  | MuteAudioAction
  | MuteVideoAction
  | RemovePendingOfferAction
  | StartScreenShareSuccessAction
  | StopScreenShareSuccessAction
  | UnmuteAudioAction
  | UnmuteVideoAction
  | UpdateICEServersAction
  | UpdateLocalStreamAction
  | UpdateMaximumBitrateStartedAction
  | UpdateMaximumBitrateSuccessAction
  | UpdatePeerIdAction
  | UpdateRemoteStreamAction
  | UpdateSendSignalingMessageAction
  | UpdateStatsReportAction;
