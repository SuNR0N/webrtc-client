import { useCallback, useEffect, useRef } from 'react';

import { WebRTCContextActionType } from '../actions/webrtc-context-action';
import { SignalingContextActionType } from '../actions/signaling-context-action';
import { useWebRTCContext, useSignalingContext } from '../contexts';
import { SignalingMessage, SignalingMessageType } from '../models/signaling-message';
import { ConnectionState } from '../reducers/signaling-context-reducer';

export const useWebSocket = (uri?: string) => {
  const { dispatch: dispatchSignalingAction, state } = useSignalingContext();
  const { dispatch: dispatchWebRTCAction } = useWebRTCContext();
  const { connectionState } = state;

  const socketRef = useRef<WebSocket | null>(null);

  const handleOpen = useCallback(() => {
    dispatchSignalingAction({ type: SignalingContextActionType.Connected });
    dispatchWebRTCAction({ type: WebRTCContextActionType.UpdateSignalingSocket, payload: socketRef.current! });
    console.log(`WebSocket connection has been opened with '${uri}'`);
  }, [dispatchSignalingAction, dispatchWebRTCAction, uri]);

  const handleError = useCallback(
    (event: Event) => {
      dispatchSignalingAction({ type: SignalingContextActionType.Disconnected });
      console.log('An error has occurred on the WebSocket connection:', event);
    },
    [dispatchSignalingAction]
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: SignalingMessage = JSON.parse(event.data);
        switch (message.type) {
          case SignalingMessageType.Answer:
            dispatchWebRTCAction({ type: WebRTCContextActionType.AnswerReceived, payload: message.payload });
            break;
          case SignalingMessageType.Bye:
            dispatchWebRTCAction({ type: WebRTCContextActionType.ClosePeerConnection, payload: message.payload.id });
            break;
          case SignalingMessageType.Candidate:
            dispatchWebRTCAction({ type: WebRTCContextActionType.AddICECandidate, payload: message.payload });
            break;
          case SignalingMessageType.Hello:
            dispatchSignalingAction({ type: SignalingContextActionType.UpdateClientId, payload: message.payload });
            break;
          case SignalingMessageType.IceServers:
            dispatchWebRTCAction({ type: WebRTCContextActionType.UpdateICEServers, payload: message.payload });
            break;
          case SignalingMessageType.Offer:
            dispatchWebRTCAction({ type: WebRTCContextActionType.OfferReceived, payload: message.payload });
            break;
          default:
            throw new Error(`Unknown message type: ${(message as any).type}`);
        }
        console.log('WebSocket message received:', message);
      } catch (err) {
        console.log('Failed to parse WebSocket message:', event.data, err);
      }
    },
    [dispatchWebRTCAction, dispatchSignalingAction]
  );

  const handleClose = useCallback(() => {
    dispatchSignalingAction({ type: SignalingContextActionType.Disconnected });
    console.log(`WebSocket connection has been closed with '${uri}'`);
    socketRef.current?.removeEventListener('close', handleClose);
    socketRef.current?.removeEventListener('error', handleError);
    socketRef.current?.removeEventListener('message', handleMessage);
    socketRef.current?.removeEventListener('open', handleOpen);
    socketRef.current = null;
  }, [dispatchSignalingAction, handleError, handleMessage, handleOpen, uri]);

  useEffect(() => {
    if (uri) {
      const ws = new WebSocket(uri);
      ws.addEventListener('close', handleClose);
      ws.addEventListener('error', handleError);
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('open', handleOpen);
      socketRef.current = ws;
    }
    return () => {
      socketRef.current?.close();
    };
  }, [dispatchSignalingAction, handleClose, handleError, handleMessage, handleOpen, uri]);

  useEffect(() => {
    if (connectionState === ConnectionState.Disconnecting) {
      if (!socketRef.current) {
        dispatchSignalingAction({ type: SignalingContextActionType.Disconnected });
      } else {
        socketRef.current.close();
      }
    }
  }, [connectionState, dispatchSignalingAction]);
};
