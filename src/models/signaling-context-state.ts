export enum ConnectionState {
  Connecting,
  Connected,
  Disconnecting,
  Disconnected,
}

export interface SignalingContextState {
  clientId?: string;
  connectionState: ConnectionState;
  signalingServerUri?: string;
}
