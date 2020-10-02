import { CandidatePair } from './candidate-pair';
import { Offer } from './offer';
import { SendSignalingMessage } from './signaling-message';

export interface WebRTCContextState {
  audioMuted: boolean;
  avStream?: MediaStream;
  iceServers?: RTCIceServer[];
  latestCandidatePair?: CandidatePair;
  latestStatsReport?: RTCStatsReport;
  localStream?: MediaStream;
  maximumBitrate: number;
  maximumBitrateChangeInProgress: boolean;
  peerId?: string;
  peers: Map<string, RTCPeerConnection>;
  pendingOffers: Offer[];
  queryStatsInterval: number;
  remoteStream?: MediaStream;
  screenShare?: MediaStream;
  sendSignalingMessage: SendSignalingMessage;
  videoMuted: boolean;
}
