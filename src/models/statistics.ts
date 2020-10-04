import { Candidate } from './candidate';

export interface OutboundStatistics {
  bitrate?: number;
  headerBitrate?: number;
  packetRate?: number;
}

export interface InboundStatistics {
  jitter?: number;
  packetsLost?: number;
}

interface CandidateStatistics {
  localCandidate?: Candidate;
  remoteCandidate?: Candidate;
}

export type Statistics = InboundStatistics & OutboundStatistics & CandidateStatistics;
