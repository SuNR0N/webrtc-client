import { CandidatePair } from './candidate-pair';
import { SendSignalingMessage } from './signaling-message';

export interface WebRTCContextState {
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
