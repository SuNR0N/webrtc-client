import React, { ChangeEvent, FC, useEffect, useState } from 'react';
import { Grid } from '@material-ui/core';

import { ControlBar, SettingsPanel, Video } from '../';
import { useWebRTCContext, useSignalingContext } from '../../contexts';
import { WebRTCContextActionType } from '../../actions/webrtc-context-action';
import { InputGroup } from '../InputGroup/InputGroup';
import { ConnectionState } from '../../models';
import { IncomingConnectionControls } from '../IncomingConnectionControls/IncomingConnectionControls';

interface FormFields {
  peerId: string;
}

export const App: FC = () => {
  const {
    dispatch: dispatchWebRTCAction,
    state: { pendingOffers, localStream, peerId, remoteStream },
  } = useWebRTCContext();
  const {
    state: { clientId, connectionState },
  } = useSignalingContext();
  const [fieldValues, setFieldValues] = useState<FormFields>({
    peerId: '',
  });

  const handleInitiatePeerConnection = () => {
    dispatchWebRTCAction({ type: WebRTCContextActionType.InitiatePeerConnection, payload: fieldValues.peerId });
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    if (target) {
      setFieldValues((previousState) => ({
        ...previousState,
        [target.name]: target.value,
      }));
    }
  };

  const handleAccept = () => {
    dispatchWebRTCAction({ type: WebRTCContextActionType.AcceptOffer, payload: pendingOffers[0].id });
  };

  const handleDecline = () => {
    dispatchWebRTCAction({ type: WebRTCContextActionType.DeclineOffer, payload: pendingOffers[0].id });
  };

  useEffect(() => {
    dispatchWebRTCAction({ type: WebRTCContextActionType.InitAVStream });
  }, [dispatchWebRTCAction]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SettingsPanel />
      </Grid>
      <Grid item xs={6}>
        <Video
          id={clientId}
          muted={true}
          stream={localStream}
          statsConfig={{
            bitrate: { enabled: true },
            framesPerSecond: { enabled: true },
            headerBitrate: { enabled: true },
            jitter: { enabled: true },
            latency: { enabled: true },
            packetRate: { enabled: true },
            packetsLost: { enabled: true },
            roundTripTime: { enabled: true },
            localCandidate: { enabled: true },
          }}
        />
      </Grid>
      <Grid container item xs={6} alignItems="center">
        {remoteStream ? (
          <Video
            id={peerId}
            stream={remoteStream}
            flipHorizontal={true}
            statsConfig={{
              remoteCandidate: { enabled: true },
            }}
          />
        ) : pendingOffers.length ? (
          <IncomingConnectionControls id={pendingOffers[0].id} onAccept={handleAccept} onDecline={handleDecline} />
        ) : (
          <InputGroup
            buttonColor="success"
            buttonText="Call"
            disabled={connectionState !== ConnectionState.Connected}
            id="inputPeerId"
            label="Peer ID"
            name="peerId"
            onButtonClick={handleInitiatePeerConnection}
            onChange={handleChange}
            value={fieldValues.peerId}
          />
        )}
      </Grid>
      <Grid item xs={12}>
        <ControlBar />
      </Grid>
    </Grid>
  );
};
