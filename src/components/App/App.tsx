import React, { ChangeEvent, FC, useState } from 'react';
import { Button, Grid } from '@material-ui/core';

import { ControlBar, IncomingConnectionControls, InputDevicesDialog, InputGroup, SettingsPanel, Video } from '../';
import { useWebRTCContext, useSignalingContext } from '../../contexts';
import { WebRTCContextActionType } from '../../actions/webrtc-context-action';
import { ConnectionState } from '../../models';

interface FormFields {
  peerId: string;
}

export const App: FC = () => {
  const [showDialog, setShowDialog] = useState(true);
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

  const handleSelectInputDevices = (audioDeviceId: string, videoDeviceId: string) => {
    handleCloseInputDevicesDialog();
    dispatchWebRTCAction({ type: WebRTCContextActionType.InitAVStream, payload: { audioDeviceId, videoDeviceId } });
  };

  const handleShowInputDevicesDialog = () => {
    setShowDialog(true);
  };

  const handleCloseInputDevicesDialog = () => {
    setShowDialog(false);
  };

  return (
    <Grid container spacing={3}>
      <InputDevicesDialog open={showDialog} onClose={handleCloseInputDevicesDialog} onSelectInputDevices={handleSelectInputDevices} />
      <Grid item xs={12}>
        <SettingsPanel />
      </Grid>
      <Grid container item xs={6} alignItems="center" justify="center">
        {localStream ? (
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
        ) : (
          <Button variant="outlined" color="primary" onClick={handleShowInputDevicesDialog}>
            Show Input Devices
          </Button>
        )}
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
      {localStream && (
        <Grid item xs={12}>
          <ControlBar />
        </Grid>
      )}
    </Grid>
  );
};
