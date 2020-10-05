import React, { ChangeEvent, FC, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';

import { useDevices } from '../../hooks';

interface Props {
  onClose?: () => void;
  onSelectInputDevices?: (audioDeviceId: string, videoDeviceId: string) => void;
  open?: boolean;
}

interface FormFields {
  audioInput: string;
  videoInput: string;
}

export const InputDevicesDialog: FC<Props> = ({ onClose, onSelectInputDevices: onSelectDevices, open = false }) => {
  const { audioInputs, hasAudioInputPermission, hasVideoInputPermission, videoInputs } = useDevices();
  const hasInsufficientPermissions = !hasAudioInputPermission || !hasVideoInputPermission;

  const [fieldValues, setFieldValues] = useState<FormFields>({
    audioInput: '',
    videoInput: '',
  });

  const handleSelectDevices = () => {
    if (onSelectDevices) {
      onSelectDevices(fieldValues.audioInput, fieldValues.videoInput);
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
    if (audioInputs.length) {
      setFieldValues((previousState) => ({
        ...previousState,
        audioInput: audioInputs[0].id,
      }));
    }
  }, [audioInputs]);

  useEffect(() => {
    if (videoInputs.length) {
      setFieldValues((previousState) => ({
        ...previousState,
        videoInput: videoInputs[0].id,
      }));
    }
  }, [videoInputs]);

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="inputDevicesDialogTitle">
      <DialogTitle id="inputDevicesDialogTitle">Input Devices</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {hasInsufficientPermissions ? (
            <Grid item xs={12}>
              <DialogContentText>The application needs to access your input audio/video devices.</DialogContentText>
            </Grid>
          ) : (
            <>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel htmlFor="inputAudioInput">Microphones</InputLabel>
                  <Select
                    fullWidth
                    label="Microphones"
                    id="inputAudioInput"
                    name="audioInput"
                    value={fieldValues.audioInput}
                    onChange={handleSelect}
                  >
                    {audioInputs.map(({ label, id }) => (
                      <MenuItem key={id} value={id}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel htmlFor="inputVideoInput">Cameras</InputLabel>
                  <Select
                    fullWidth
                    label="Cameras"
                    id="inputVideoInput"
                    name="videoInput"
                    value={fieldValues.videoInput}
                    onChange={handleSelect}
                  >
                    {videoInputs.map(({ label, id }) => (
                      <MenuItem key={id} value={id}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSelectDevices} color="primary" disabled={hasInsufficientPermissions}>
          Select
        </Button>
      </DialogActions>
    </Dialog>
  );
};
