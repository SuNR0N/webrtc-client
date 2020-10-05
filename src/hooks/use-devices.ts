import { useCallback, useEffect, useState } from 'react';
import adapter from 'webrtc-adapter';

interface DeviceInfo {
  id: string;
  label: string;
}

interface Devices {
  audioInputs: DeviceInfo[];
  hasAudioInput: boolean;
  hasAudioInputPermission: boolean;
  hasVideoInput: boolean;
  hasVideoInputPermission: boolean;
  videoInputs: DeviceInfo[];
}

export const useDevices = (): Devices => {
  const {
    browserDetails: { browser, version },
  } = adapter;
  const [state, setState] = useState<Devices>({
    audioInputs: [],
    hasAudioInput: false,
    hasAudioInputPermission: false,
    hasVideoInput: false,
    hasVideoInputPermission: false,
    videoInputs: [],
  });

  const updateDeviceList = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    } catch (err) {
      console.log('Could not access media devices due to ungranted permissions');
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices
      .filter((device) => device.kind === 'audioinput')
      .map<DeviceInfo>((device, i) => ({
        id: device.deviceId,
        label: device.label || `Audio Input #${i + 1}`,
      }));
    const videoInputs = devices
      .filter((device) => device.kind === 'videoinput')
      .map<DeviceInfo>((device, i) => ({
        id: device.deviceId,
        label: device.label || `Video Input #${i + 1}`,
      }));
    const hasAudioInput = audioInputs.length > 0;
    const hasVideoInput = videoInputs.length > 0;
    let hasAudioInputPermission = false;
    let hasVideoInputPermission = false;
    if (browser === 'chrome' && version && version >= 86) {
      hasAudioInputPermission = (await navigator.permissions.query({ name: 'microphone' })).state === 'granted';
      hasVideoInputPermission = (await navigator.permissions.query({ name: 'camera' })).state === 'granted';
    } else {
      hasAudioInputPermission = !!devices.find((device) => device.kind === 'audioinput' && device.label !== '');
      hasVideoInputPermission = !!devices.find((device) => device.kind === 'videoinput' && device.label !== '');
    }
    setState({
      audioInputs,
      hasAudioInput,
      hasAudioInputPermission,
      hasVideoInput,
      hasVideoInputPermission,
      videoInputs,
    });
  }, [browser, version]);

  useEffect(() => {
    navigator.mediaDevices.addEventListener('devicechange', updateDeviceList);
    updateDeviceList();

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', updateDeviceList);
    };
  }, [updateDeviceList]);

  return state;
};
