import React, { createContext, Dispatch, FC, useContext, useReducer } from 'react';

import { SignalingContextAction } from '../../actions/signaling-context-action';
import { SignalingContextState } from '../../models';
import { initialState, reducer } from '../../reducers/signaling-context-reducer';

interface SignalingContextType {
  state: SignalingContextState;
  dispatch: Dispatch<SignalingContextAction>;
}

const SignalingContext = createContext<SignalingContextType | undefined>(undefined);

export const SignalingContextProvider: FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <SignalingContext.Provider value={{ state, dispatch }}>{children}</SignalingContext.Provider>;
};

export const useSignalingContext = () => {
  const context = useContext(SignalingContext);
  if (context === undefined) {
    throw new Error('useSignalingContext must be used within a SignalingContextProvider');
  }

  return context;
};
