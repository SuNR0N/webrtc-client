import React, { createContext, Dispatch, FC, useContext } from 'react';
import { useReducerAsync } from 'use-reducer-async';

import { AsyncWebRTCContextAction, WebRTCContextAction } from '../../actions/webrtc-context-action';
import { WebRTCContextState } from '../../models';
import { asyncActionHandlers, initialState, reducer } from '../../reducers/webrtc-context-reducer';

interface WebRTCContextType {
  state: WebRTCContextState;
  dispatch: Dispatch<WebRTCContextAction | AsyncWebRTCContextAction>;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export const WebRTCContextProvider: FC = ({ children }) => {
  const [state, dispatch] = useReducerAsync(reducer, initialState, asyncActionHandlers);

  return <WebRTCContext.Provider value={{ state, dispatch }}>{children}</WebRTCContext.Provider>;
};

export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext);
  if (context === undefined) {
    throw new Error('useWebRTCContext must be used within a WebRTCContextProvider');
  }

  return context;
};
