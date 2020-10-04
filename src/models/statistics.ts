import { Candidate } from './candidate';

export interface OutboundStatistics {
  bitrate?: number;
  headerBitrate?: number;
  packetRate?: number;
}

export interface RemoteInboundStatistics {
  jitter?: number;
  packetsLost?: number;
}

interface CandidateStatistics {
  localCandidate?: Candidate;
  remoteCandidate?: Candidate;
}

export type Statistics = RemoteInboundStatistics & OutboundStatistics & CandidateStatistics;
