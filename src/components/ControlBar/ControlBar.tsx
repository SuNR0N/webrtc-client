import React, { FC } from 'react';
import cn from 'classnames';
import { Grid } from '@material-ui/core';
import { CallEnd, Mic, MicOff, ScreenShare, StopScreenShare, Videocam, VideocamOff } from '@material-ui/icons';

import { useWebRTCContext } from '../../contexts';
import { WebRTCContextActionType } from '../../actions/webrtc-context-action';
import { RoundedIconButton } from '../RoundedIconButton/RoundedIconButton';
import './ControlBar.scss';

interface Props {
  className?: string;
}

export const ControlBar: FC<Props> = ({ className }) => {
  const {
    dispatch: dispatchWebRTCAction,
    state: { audioMuted, peerId, videoMuted, screenShare },
  } = useWebRTCContext();

  const handleHangUp = () => {
    dispatchWebRTCAction({ type: WebRTCContextActionType.HangUp });
  };

  const handleToggleMuteAudio = () => {
    dispatchWebRTCAction({ type: audioMuted ? WebRTCContextActionType.UnmuteAudio : WebRTCContextActionType.MuteAudio });
  };

  const handleToggleMuteVideo = () => {
    dispatchWebRTCAction({ type: videoMuted ? WebRTCContextActionType.UnmuteVideo : WebRTCContextActionType.MuteVideo });
  };

  const handleToggleScreenShare = () => {
    dispatchWebRTCAction({ type: screenShare ? WebRTCContextActionType.StopScreenShare : WebRTCContextActionType.StartScreenShare });
  };

  return (
    <Grid container justify="center" className={cn('control-bar', className)} spacing={2}>
      <Grid item>
        <RoundedIconButton
          icon={audioMuted ? MicOff : Mic}
          color={!audioMuted ? 'success' : 'error'}
          tooltip={`Turn ${audioMuted ? 'on' : 'off'} microphone`}
          onClick={handleToggleMuteAudio}
        />
      </Grid>
      <Grid item>
        <RoundedIconButton
          icon={videoMuted ? VideocamOff : Videocam}
          color={!videoMuted ? 'success' : 'error'}
          tooltip={`Turn ${videoMuted ? 'on' : 'off'} camera`}
          onClick={handleToggleMuteVideo}
        />
      </Grid>
      <Grid item>
        <RoundedIconButton
          icon={screenShare ? ScreenShare : StopScreenShare}
          color={screenShare ? 'success' : 'error'}
          tooltip={screenShare ? 'Stop sharing your screen' : 'Share your screen'}
          onClick={handleToggleScreenShare}
        />
      </Grid>
      {peerId && (
        <Grid item>
          <RoundedIconButton icon={CallEnd} color="error" tooltip="Leave the meeting" onClick={handleHangUp} />
        </Grid>
      )}
    </Grid>
  );
};
