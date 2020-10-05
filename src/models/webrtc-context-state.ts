import { Offer } from './offer';
import { SendSignalingMessage } from './signaling-message';
import { Statistics } from './statistics';

export interface WebRTCContextState {
  audioCodec?: RTCRtpCodecCapability;
  audioMuted: boolean;
  avStream?: MediaStream;
  iceServers?: RTCIceServer[];
  latestStatsReport?: RTCStatsReport;
  localStream?: MediaStream;
  maximumBitrate: number;
  maximumBitrateChangeInProgress: boolean;
  peerId?: string;
  peers: Map<string, RTCPeerConnection>;
  pendingOffers: Offer[];
  queryStatsInterval: number;
  querySynchronizationSourcesInterval: number;
  remoteStream?: MediaStream;
  screenShare?: MediaStream;
  sendSignalingMessage: SendSignalingMessage;
  statistics: Statistics;
  videoCodec?: RTCRtpCodecCapability;
  videoMuted: boolean;
}
