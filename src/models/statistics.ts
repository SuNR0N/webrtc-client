import { Candidate } from './candidate';

export interface RateStatistics {
  bitrate?: number;
  headerBitrate?: number;
  packetRate?: number;
}

export interface Statistics extends RateStatistics {
  localCandidate?: Candidate;
  remoteCandidate?: Candidate;
}
