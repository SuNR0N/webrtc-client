import { Candidate } from './candidate';

export interface OutboundStatistics {
  bitrate?: number;
  framesPerSecond?: number;
  headerBitrate?: number;
  packetRate?: number;
}

export interface RemoteInboundStatistics {
  jitter?: number;
  latency?: number;
  packetsLost?: number;
  roundTripTime?: number;
}

interface CandidateStatistics {
  localCandidate?: Candidate;
  remoteCandidate?: Candidate;
}

export type Statistics = RemoteInboundStatistics & OutboundStatistics & CandidateStatistics;
