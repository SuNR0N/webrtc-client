import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './components';
import { SignalingContextProvider, WebRTCContextProvider } from './contexts';
import * as serviceWorker from './serviceWorker';
import './styles/styles.scss';

ReactDOM.render(
  <React.StrictMode>
    <SignalingContextProvider>
      <WebRTCContextProvider>
        <App />
      </WebRTCContextProvider>
    </SignalingContextProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
