import React, { FC } from 'react';
import cn from 'classnames';
import { Grid, IconButton, Tooltip } from '@material-ui/core';
import { CallEnd, Mic, MicOff, ScreenShare, StopScreenShare, Videocam, VideocamOff } from '@material-ui/icons';

import { useWebRTCContext } from '../../contexts';
import { WebRTCContextActionType } from '../../actions/webrtc-context-action';
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
    <Grid container justify="center" className={cn('control-bar', className)} spacing={1}>
      <Grid item>
        <Tooltip title={`Turn ${audioMuted ? 'on' : 'off'} microphone`}>
          <IconButton
            onClick={handleToggleMuteAudio}
            className={cn('control-bar__button', {
              'control-bar__button--on': !audioMuted,
              'control-bar__button--off': audioMuted,
            })}
          >
            {audioMuted ? <MicOff /> : <Mic />}
          </IconButton>
        </Tooltip>
      </Grid>
      <Grid item>
        <Tooltip title={`Turn ${videoMuted ? 'on' : 'off'} camera`}>
          <IconButton
            onClick={handleToggleMuteVideo}
            className={cn('control-bar__button', {
              'control-bar__button--on': !videoMuted,
              'control-bar__button--off': videoMuted,
            })}
          >
            {videoMuted ? <VideocamOff /> : <Videocam />}
          </IconButton>
        </Tooltip>
      </Grid>
      <Grid item>
        <Tooltip title={screenShare ? 'Stop sharing your screen' : 'Share your screen'}>
          <IconButton
            onClick={handleToggleScreenShare}
            className={cn('control-bar__button', {
              'control-bar__button--on': screenShare,
              'control-bar__button--off': !screenShare,
            })}
          >
            {screenShare ? <ScreenShare /> : <StopScreenShare />}
          </IconButton>
        </Tooltip>
      </Grid>
      {peerId && (
        <Grid item>
          <Tooltip title="Leave the meeting">
            <IconButton onClick={handleHangUp} className={cn('control-bar__button', 'control-bar__button--off')}>
              <CallEnd />
            </IconButton>
          </Tooltip>
        </Grid>
      )}
    </Grid>
  );
};
