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
  mediaRecorder?: MediaRecorder;
  peerId?: string;
  peers: Map<string, RTCPeerConnection>;
  pendingOffers: Offer[];
  recordInProgress: boolean;
  recording?: Blob;
  recordingMimeType?: string;
  queryStatsInterval: number;
  querySynchronizationSourcesInterval: number;
  recordedBlobs: Blob[];
  remoteStream?: MediaStream;
  screenShare?: MediaStream;
  sendSignalingMessage: SendSignalingMessage;
  statistics: Statistics;
  videoCodec?: RTCRtpCodecCapability;
  videoMuted: boolean;
}
