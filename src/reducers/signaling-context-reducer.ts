import { SignalingContextActionType, SignalingContextAction } from '../actions/signaling-context-action';

export enum ConnectionState {
  Connecting,
  Connected,
  Disconnecting,
  Disconnected,
}

export interface State {
  clientId?: string;
  connectionState: ConnectionState;
  signalingServerUri?: string;
}

export const initialState: State = {
  clientId: undefined,
  connectionState: ConnectionState.Disconnected,
  signalingServerUri: undefined,
};

export const reducer = (state: State, action: SignalingContextAction): State => {
  switch (action.type) {
    case SignalingContextActionType.Connect:
      return {
        ...state,
        connectionState: ConnectionState.Connecting,
        signalingServerUri: action.payload,
      };
    case SignalingContextActionType.Connected:
      return {
        ...state,
        connectionState: ConnectionState.Connected,
      };
    case SignalingContextActionType.Disconnect:
      return {
        ...state,
        connectionState: ConnectionState.Disconnecting,
        signalingServerUri: undefined,
      };
    case SignalingContextActionType.Disconnected:
      return {
        ...state,
        connectionState: ConnectionState.Disconnected,
        signalingServerUri: undefined,
      };
    case SignalingContextActionType.UpdateClient:
      return {
        ...state,
        clientId: action.payload,
      };
    default:
      return state;
  }
};
