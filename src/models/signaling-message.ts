import { MessageWithPayload } from './message';

export enum SignalingMessageType {
  Answer = 'answer',
  Bye = 'bye',
  Candidate = 'candidate',
  Hello = 'hello',
  IceServers = 'iceServers',
  Offer = 'offer',
}

interface AnswerMessage extends MessageWithPayload<{ id: string; sdp: string }> {
  type: typeof SignalingMessageType.Answer;
}

interface ByeMessage extends MessageWithPayload<{ id: string }> {
  type: typeof SignalingMessageType.Bye;
}

interface CandidateMessage extends MessageWithPayload<{ candidate: RTCIceCandidate; id: string }> {
  type: typeof SignalingMessageType.Candidate;
}

interface HelloMessage extends MessageWithPayload<string> {
  type: typeof SignalingMessageType.Hello;
}

interface ICEServersMessage extends MessageWithPayload<RTCIceServer[]> {
  type: typeof SignalingMessageType.IceServers;
}

interface OfferMessage extends MessageWithPayload<{ id: string; sdp: string }> {
  type: typeof SignalingMessageType.Offer;
}

export type SignalingMessage = AnswerMessage | ByeMessage | CandidateMessage | HelloMessage | ICEServersMessage | OfferMessage;
