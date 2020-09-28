import { Action, ActionWithPayload } from '../models/action';

export enum SignalingContextActionType {
  Connect = 'Connect',
  Connected = 'Connected',
  Disconnect = 'Disconnect',
  Disconnected = 'Disconnected',
  UpdateClient = 'UpdateClient',
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

interface UpdateClientAction extends ActionWithPayload<string> {
  type: typeof SignalingContextActionType.UpdateClient;
}

export type SignalingContextAction = ConnectAction | ConnectedAction | DisconnectAction | DisconnectedAction | UpdateClientAction;
