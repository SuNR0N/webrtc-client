import { RTCNetworkType } from './rtc-network-type';

// https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidateStats
export interface RTCIceCandidateStats {
  address?: string;
  candidateType?: RTCIceCandidateType;
  deleted?: boolean;
  networkType?: RTCNetworkType;
  port?: number;
  priority?: number;
  protocol?: string;
  relayProtocol?: string;
  transportId?: string;
  url?: string;
}
