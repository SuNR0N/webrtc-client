import React, { ChangeEvent, FC, useEffect, useState } from 'react';
import cn from 'classnames';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Switch,
  Tooltip,
} from '@material-ui/core';
import { ExpandMore, OfflineBolt, Settings } from '@material-ui/icons';

import { useSignalingContext, useWebRTCContext } from '../../contexts';
import { SignalingContextActionType } from '../../actions/signaling-context-action';
import { useWebSocket } from '../../hooks';
import { disableLogging, enableLogging } from '../../utils/logging-utils';
import { ConnectionState, MenuOption } from '../../models';
import { WebRTCContextActionType } from '../../actions/webrtc-context-action';
import { setCodecPreferencesSupported } from '../../utils/webrtc-utils';
import './SettingsPanel.scss';

interface Props {
  className?: string;
}

interface FormFields {
  audioCodec: RTCRtpCodecCapability | string;
  debug: boolean;
  signalingServerUri: string;
  maximumBitrate: string;
  videoCodec: RTCRtpCodecCapability | string;
}

const BITRATE_OPTIONS: MenuOption<number>[] = [
  { label: 'Unlimited', value: 0 },
  { label: '2000', value: 2000 },
  { label: '1000', value: 1000 },
  { label: '500', value: 500 },
  { label: '250', value: 250 },
  { label: '125', value: 125 },
];

const VIDEO_CODEC_OPTIONS = ((setCodecPreferencesSupported && RTCRtpSender.getCapabilities('video')?.codecs) || []).reduce(
  (acc, codec) => {
    const excludedCodecs = ['video/rtx', 'video/red', 'video/ulpfec'];
    const { clockRate, mimeType, sdpFmtpLine } = codec;
    if (!excludedCodecs.includes(mimeType)) {
      const labelParts = [mimeType, `${clockRate} Hz`];
      switch (mimeType) {
        case 'video/VP9':
          sdpFmtpLine && labelParts.push(sdpFmtpLine.replace(/profile-id=(\d)/, 'Profile $1'));
          break;
        case 'video/H264':
          sdpFmtpLine &&
            labelParts.push(
              sdpFmtpLine.replace(/.*packetization-mode=(\d);profile-level-id=(.*)/, 'Packetization Mode $1 | Profile Level $2')
            );
          break;
        default:
          break;
      }
      acc.push({
        label: labelParts.join(' | '),
        value: codec,
      });
    }
    return acc;
  },
  [{ label: 'Default', value: 'default' }] as MenuOption<RTCRtpCodecCapability | string>[]
);

const AUDIO_CODEC_OPTIONS = ((setCodecPreferencesSupported && RTCRtpSender.getCapabilities('audio')?.codecs) || []).reduce(
  (acc, codec) => {
    const { clockRate, mimeType, channels } = codec;
    const labelParts = [mimeType, `${clockRate} Hz`, `Channels ${channels}`];
    acc.push({
      label: labelParts.join(' | '),
      value: codec,
    });
    return acc;
  },
  [{ label: 'Default', value: 'default' }] as MenuOption<RTCRtpCodecCapability | string>[]
);

export const SettingsPanel: FC<Props> = ({ className }) => {
  const {
    dispatch: dispatchSignalingAction,
    state: { connectionState, signalingServerUri },
  } = useSignalingContext();
  const {
    dispatch: dispatchWebRTCAction,
    state: { iceServers, maximumBitrateChangeInProgress },
  } = useWebRTCContext();
  useWebSocket(signalingServerUri);
  const [fieldValues, setFieldValues] = useState<FormFields>({
    audioCodec: 'default',
    debug: true,
    maximumBitrate: '0',
    signalingServerUri: '',
    videoCodec: 'default',
  });
  const { audioCodec, debug, maximumBitrate, videoCodec } = fieldValues;

  const handleConnect = () => {
    dispatchSignalingAction({ type: SignalingContextActionType.Connect, payload: fieldValues.signalingServerUri });
  };

  const handleDisconnect = () => {
    dispatchSignalingAction({ type: SignalingContextActionType.Disconnect });
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

  const handleSwitch = (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    if (target) {
      setFieldValues((previousState) => ({
        ...previousState,
        [target.name]: target.checked,
      }));
    }
  };

  const handleSelect = (event: ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setFieldValues((previousState) => ({
      ...previousState,
      [name!]: value,
    }));
  };

  useEffect(() => {
    debug ? enableLogging() : disableLogging();
  }, [debug]);

  useEffect(() => {
    dispatchWebRTCAction({
      type: WebRTCContextActionType.UpdateMaximumBitrate,
      payload: parseInt(maximumBitrate, 10),
    });
  }, [dispatchWebRTCAction, maximumBitrate]);

  useEffect(() => {
    dispatchWebRTCAction({
      type: WebRTCContextActionType.UpdateAudioCodec,
      payload: typeof audioCodec === 'string' ? undefined : audioCodec,
    });
  }, [dispatchWebRTCAction, audioCodec]);

  useEffect(() => {
    dispatchWebRTCAction({
      type: WebRTCContextActionType.UpdateVideoCodec,
      payload: typeof videoCodec === 'string' ? undefined : videoCodec,
    });
  }, [dispatchWebRTCAction, videoCodec]);

  return (
    <Accordion className={cn('settings-panel', className)}>
      <AccordionSummary className="settings-panel__summary" expandIcon={<ExpandMore />}>
        <Grid container direction="row" justify="space-between" alignItems="center">
          <Grid className="settings-panel__summary-title" container item xs={6}>
            <Settings /> Settings
          </Grid>
          <Grid container item xs={6} justify="flex-end">
            <Tooltip title={connectionState === ConnectionState.Connected ? 'Online' : 'Offline'}>
              <OfflineBolt
                className={cn({
                  'settings-panel__summary-status--online': iceServers?.length,
                  'settings-panel__summary-status--offline': !iceServers,
                })}
              />
            </Tooltip>
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" disabled={connectionState !== ConnectionState.Disconnected}>
              <InputLabel htmlFor="inputSignalingServerUri">Signaling Server URI</InputLabel>
              <OutlinedInput
                label="Signaling Server URI"
                id="inputSignalingServerUri"
                name="signalingServerUri"
                value={fieldValues.signalingServerUri}
                onChange={handleChange}
                endAdornment={
                  <InputAdornment position="end">
                    {connectionState === ConnectionState.Connected ? (
                      <Button color="secondary" onClick={handleDisconnect}>
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        color="primary"
                        onClick={handleConnect}
                        disabled={fieldValues.signalingServerUri.trim().length === 0 || connectionState !== ConnectionState.Disconnected}
                      >
                        Connect
                      </Button>
                    )}
                  </InputAdornment>
                }
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="inputMaximumBitrate">Maximum Bitrate (kbps)</InputLabel>
              <Select
                label="Maximum Bitrate (kbps)"
                id="inputMaximumBitrate"
                name="maximumBitrate"
                value={fieldValues.maximumBitrate}
                onChange={handleSelect}
                disabled={maximumBitrateChangeInProgress}
              >
                {BITRATE_OPTIONS.map(({ label, value }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" disabled={!setCodecPreferencesSupported}>
              <InputLabel id="inputVideoCodec">Video Codec</InputLabel>
              <Select label="Video Codec" id="inputVideoCodec" name="videoCodec" value={fieldValues.videoCodec} onChange={handleSelect}>
                {VIDEO_CODEC_OPTIONS.map(({ label, value }, i) => (
                  <MenuItem key={JSON.stringify(value)} value={value as any}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" disabled={!setCodecPreferencesSupported}>
              <InputLabel id="inputAudioCodec">Audio Codec</InputLabel>
              <Select label="Audio Codec" id="inputAudioCodec" name="audioCodec" value={fieldValues.audioCodec} onChange={handleSelect}>
                {AUDIO_CODEC_OPTIONS.map(({ label, value }) => (
                  <MenuItem key={JSON.stringify(value)} value={value as any}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid container item xs={12} sm={6}>
            <FormControlLabel control={<Switch color="primary" checked={debug} onChange={handleSwitch} name="debug" />} label="Debug" />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};
