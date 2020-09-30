import { SignalingContextActionType, SignalingContextAction } from '../actions/signaling-context-action';
import { ConnectionState, SignalingContextState } from '../models';

export const initialState: SignalingContextState = {
  clientId: undefined,
  connectionState: ConnectionState.Disconnected,
  signalingServerUri: undefined,
};

export const reducer = (state: SignalingContextState, action: SignalingContextAction): SignalingContextState => {
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
        clientId: undefined,
        connectionState: ConnectionState.Disconnected,
        signalingServerUri: undefined,
      };
    case SignalingContextActionType.UpdateClientId:
      return {
        ...state,
        clientId: action.payload,
      };
    default:
      return state;
  }
};
