import { Box } from '@material-ui/core';
import React, { FC } from 'react';
import cn from 'classnames';

import { useWebRTCContext } from '../../contexts';
import { Statistics, StatsConfig, StatisticConfig } from '../../models';
import './VideoStatistics.scss';

interface Props {
  config?: StatsConfig<Statistics, Partial<StatisticConfig<Statistics>>>;
}

const defaultConfig: Required<StatsConfig<Statistics, StatisticConfig<Statistics>>> = {
  bitrate: { enabled: false, renderer: (value) => `Bitrate: ${value}kbps` },
  headerBitrate: { enabled: false, renderer: (value) => `Overhead: ${value}kbps` },
  jitter: { enabled: false, renderer: (value) => `Jitter: ${value}` },
  localCandidate: {
    enabled: false,
    renderer: (value) => `Local address: ${value?.toString()}`,
  },
  packetRate: { enabled: false, renderer: (value) => `Packet rate: ${value}pps` },
  packetsLost: { enabled: false, renderer: (value) => `Packets lost: ${value}` },
  remoteCandidate: {
    enabled: false,
    renderer: (value) => `Remote address: ${value?.toString()}`,
  },
};

export const VideoStatistics: FC<Props> = ({ config }) => {
  const configuration: Required<StatsConfig<Statistics, StatisticConfig<Statistics>>> = {
    ...defaultConfig,
    bitrate: {
      ...defaultConfig.bitrate,
      ...config?.bitrate,
    },
    headerBitrate: {
      ...defaultConfig.headerBitrate,
      ...config?.headerBitrate,
    },
    jitter: {
      ...defaultConfig.jitter,
      ...config?.jitter,
    },
    localCandidate: {
      ...defaultConfig.localCandidate,
      ...config?.localCandidate,
    },
    packetRate: {
      ...defaultConfig.packetRate,
      ...config?.packetRate,
    },
    packetsLost: {
      ...defaultConfig.packetsLost,
      ...config?.packetsLost,
    },
    remoteCandidate: {
      ...defaultConfig.remoteCandidate,
      ...config?.remoteCandidate,
    },
  };
  const {
    state: { statistics },
  } = useWebRTCContext();

  const items = Object.entries(configuration)
    .filter(([name, stat]) => stat?.enabled && statistics[name as keyof Statistics] !== undefined)
    .map(([name, stat]) => (
      <li className="video-statistics__item" key={name}>
        {stat.renderer((statistics as any)[name])}
      </li>
    ));

  return (
    <Box component="ul" className={cn('video-statistics', { 'video-statistics--empty': !items.length })}>
      {items}
    </Box>
  );
};
