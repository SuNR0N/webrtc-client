export interface Message {
  type: string;
}

export interface MessageWithPayload<P> extends Message {
  payload: P;
}
