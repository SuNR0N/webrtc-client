import React, { FC } from 'react';
import cn from 'classnames';
import { Grid, Link } from '@material-ui/core';
import {
  CallEnd,
  FiberManualRecord,
  GetApp,
  Mic,
  MicOff,
  ScreenShare,
  Stop,
  StopScreenShare,
  Videocam,
  VideocamOff,
} from '@material-ui/icons';

import { useWebRTCContext } from '../../contexts';
import { WebRTCContextActionType } from '../../actions/webrtc-context-action';
import { RoundedIconButton } from '../RoundedIconButton/RoundedIconButton';
import { useObjectURL } from '../../hooks';
import './ControlBar.scss';

interface Props {
  className?: string;
  enableRecording?: boolean;
}

export const ControlBar: FC<Props> = ({ className, enableRecording = false }) => {
  const {
    dispatch: dispatchWebRTCAction,
    state: { audioMuted, peerId, videoMuted, recording, recordInProgress, screenShare },
  } = useWebRTCContext();
  const { objectURL, created } = useObjectURL(recording);

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

  const handleToggleRecord = () => {
    dispatchWebRTCAction({ type: recordInProgress ? WebRTCContextActionType.StopRecording : WebRTCContextActionType.StartRecording });
  };

  return (
    <Grid container justify="center" className={cn('control-bar', className)} spacing={2}>
      {enableRecording && (
        <>
          <Grid item>
            <RoundedIconButton
              icon={recordInProgress ? Stop : FiberManualRecord}
              iconColor="error"
              tooltip={`${recordInProgress ? 'Stop' : 'Start'} recording`}
              onClick={handleToggleRecord}
            />
          </Grid>
          <Grid item>
            <Link href={objectURL} download={`recording_${created}.webm`}>
              <RoundedIconButton icon={GetApp} tooltip="Download recording" disabled={!recording} />
            </Link>
          </Grid>
        </>
      )}
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
