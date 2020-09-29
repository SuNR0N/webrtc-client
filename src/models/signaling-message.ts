import { MessageWithPayload } from './message';

export enum SignalingMessageType {
  Answer = 'answer',
  Bye = 'bye',
  Candidate = 'candidate',
  Hello = 'hello',
  IceServers = 'iceServers',
  Offer = 'offer',
}

interface SignalingMessagePayload {
  id: string;
}

interface SDPPayload extends SignalingMessagePayload {
  sdp: string;
}

interface AnswerMessage extends MessageWithPayload<SDPPayload> {
  type: typeof SignalingMessageType.Answer;
}

interface ByeMessage extends MessageWithPayload<SignalingMessagePayload> {
  type: typeof SignalingMessageType.Bye;
}

interface CandidateMessagePayload extends SignalingMessagePayload {
  candidate: RTCIceCandidate;
}

interface CandidateMessage extends MessageWithPayload<CandidateMessagePayload> {
  type: typeof SignalingMessageType.Candidate;
}

interface HelloMessage extends MessageWithPayload<string> {
  type: typeof SignalingMessageType.Hello;
}

interface ICEServersMessage extends MessageWithPayload<RTCIceServer[]> {
  type: typeof SignalingMessageType.IceServers;
}

interface OfferMessage extends MessageWithPayload<SDPPayload> {
  type: typeof SignalingMessageType.Offer;
}

export type SignalingMessage = AnswerMessage | ByeMessage | CandidateMessage | HelloMessage | ICEServersMessage | OfferMessage;

export const answerMessage = (payload: SDPPayload): AnswerMessage => ({
  type: SignalingMessageType.Answer,
  payload,
});

export const byeMessage = (payload: SignalingMessagePayload): ByeMessage => ({
  type: SignalingMessageType.Bye,
  payload,
});

export const candidateMessage = (payload: CandidateMessagePayload): CandidateMessage => ({
  type: SignalingMessageType.Candidate,
  payload,
});

export const offerMessage = (payload: SDPPayload): OfferMessage => ({
  type: SignalingMessageType.Offer,
  payload,
});

export interface SendSignalingMessage {
  (message: SignalingMessage): void;
}
