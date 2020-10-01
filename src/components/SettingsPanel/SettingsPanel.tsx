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
import './SettingsPanel.scss';

interface Props {
  className?: string;
}

interface FormFields {
  debug: boolean;
  signalingServerUri: string;
  maximumBitrate: string;
}

const BITRATE_OPTIONS: MenuOption<number>[] = [
  { label: 'Unlimited', value: 0 },
  { label: '2000', value: 2000 },
  { label: '1000', value: 1000 },
  { label: '500', value: 500 },
  { label: '250', value: 250 },
  { label: '125', value: 125 },
];

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
    debug: true,
    maximumBitrate: '0',
    signalingServerUri: '',
  });
  const { debug, maximumBitrate } = fieldValues;

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
          <Grid container item xs={12} sm={6}>
            <FormControlLabel control={<Switch color="primary" checked={debug} onChange={handleSwitch} name="debug" />} label="Debug" />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};
