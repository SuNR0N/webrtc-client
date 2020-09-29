import { Action, ActionWithPayload } from '../models/action';

export enum SignalingContextActionType {
  Connect = 'Connect',
  Connected = 'Connected',
  Disconnect = 'Disconnect',
  Disconnected = 'Disconnected',
  UpdateClientId = 'UpdateClientId',
}

interface ConnectAction extends ActionWithPayload<string> {
  type: typeof SignalingContextActionType.Connect;
}

interface ConnectedAction extends Action {
  type: typeof SignalingContextActionType.Connected;
}

interface DisconnectAction extends Action {
  type: typeof SignalingContextActionType.Disconnect;
}

interface DisconnectedAction extends Action {
  type: typeof SignalingContextActionType.Disconnected;
}

interface UpdateClientIdAction extends ActionWithPayload<string> {
  type: typeof SignalingContextActionType.UpdateClientId;
}

export type SignalingContextAction = ConnectAction | ConnectedAction | DisconnectAction | DisconnectedAction | UpdateClientIdAction;
