import { RTCIceCandidateStats } from './rtc';

interface CustomCandidateProperties {
  ip?: string;
  ipAddress?: string;
  portNumber?: number;
}

export class Candidate {
  static fromJSON(data: RTCIceCandidateStats & CustomCandidateProperties) {
    const { address, ip, ipAddress, port, portNumber } = data;
    return new Candidate(address || ip || ipAddress, port || portNumber);
  }

  public address?: string;
  public port?: number;

  constructor(address?: string, port?: number) {
    this.address = address;
    this.port = port;
  }

  toString() {
    return [this.address, this.port].filter(Boolean).join(' | ');
  }
}
