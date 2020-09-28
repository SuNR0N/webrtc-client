import React, { ChangeEvent, FC, useState } from 'react';
import cn from 'classnames';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  FormControl,
  InputLabel,
  InputAdornment,
  Button,
  Tooltip,
  OutlinedInput,
} from '@material-ui/core';
import { ExpandMore, OfflineBolt, Settings } from '@material-ui/icons';

import { useSignalingContext } from '../../contexts';
import { SignalingContextActionType } from '../../actions/signaling-context-action';
import { useWebSocket } from '../../hooks';
import { ConnectionState } from '../../reducers/signaling-context-reducer';
import './SettingsPanel.scss';

interface Props {
  className?: string;
}

interface FormFields {
  signalingServerUri: string;
}

export const SettingsPanel: FC<Props> = ({ className }) => {
  const {
    dispatch,
    state: { connectionState, signalingServerUri },
  } = useSignalingContext();
  useWebSocket(signalingServerUri);
  const [fieldValues, setFieldValues] = useState<FormFields>({
    signalingServerUri: '',
  });

  const handleConnect = () => {
    dispatch({ type: SignalingContextActionType.Connect, payload: fieldValues.signalingServerUri });
  };

  const handleDisconnect = () => {
    dispatch({ type: SignalingContextActionType.Disconnect });
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

  return (
    <Accordion className={cn('settings-panel', className)}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Grid container direction="row" justify="space-between" alignItems="center">
          <Grid container item xs={6}>
            <Settings /> Settings
          </Grid>
          <Grid container item xs={6} justify="flex-end">
            <Tooltip title={connectionState === ConnectionState.Connected ? 'Online' : 'Offline'}>
              <OfflineBolt
                className={cn({
                  'settings-panel__status--online': connectionState === ConnectionState.Connected,
                  'settings-panel__status--offline': connectionState !== ConnectionState.Connected,
                })}
              />
            </Tooltip>
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={6}>
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
                      <Button color="primary" onClick={handleConnect} disabled={connectionState !== ConnectionState.Disconnected}>
                        Connect
                      </Button>
                    )}
                  </InputAdornment>
                }
              />
            </FormControl>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};
