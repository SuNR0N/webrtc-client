import React, { FC, useEffect, useState } from 'react';
import cn from 'classnames';
import { Grid, Tooltip } from '@material-ui/core';
import { VolumeMute } from '@material-ui/icons';

import { IdBadge, VideoAction, VideoActions, VideoStatistics } from '../';
import { Statistics, StatsConfig, StatisticConfig } from '../../models';
import './Video.scss';

interface Props {
  autoPlay?: boolean;
  className?: string;
  flipHorizontal?: boolean;
  id?: string;
  muted?: boolean;
  playsInline?: boolean;
  showMuted?: boolean;
  stream?: MediaStream;
  statsConfig?: StatsConfig<Statistics, Partial<StatisticConfig<Statistics>>>;
}

export const Video: FC<Props> = ({
  autoPlay = true,
  className,
  id,
  flipHorizontal = false,
  muted = false,
  playsInline = true,
  showMuted = false,
  stream,
  statsConfig,
}) => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [flippedHorizontal, setFlippedHorizontal] = useState(flipHorizontal);
  const [showStatistics, setShowStatistics] = useState(false);

  useEffect(() => {
    if (stream && videoElement) {
      videoElement.srcObject = stream;
    }
  }, [stream, videoElement]);

  const handleAction = (action: VideoAction) => {
    switch (action) {
      case VideoAction.Flip:
        setFlippedHorizontal(!flippedHorizontal);
        break;
      case VideoAction.ToggleStatistics:
        setShowStatistics(!showStatistics);
        break;
      default:
        break;
    }
  };

  // Called when the first frame is rendered
  const handleLoadedMetadata = () => {
    console.log('Metadata loaded');
  };

  return (
    <Grid container className={cn('video', className)}>
      {id && (
        <Grid container item xs={12} justify="center">
          <IdBadge className="video__id-badge" id={id} />
        </Grid>
      )}
      <Grid className="video__wrapper" container item xs={12} justify="center">
        <video
          ref={(ref) => setVideoElement(ref)}
          className={cn('video__frame', { 'video__frame--flipped-horizontal': flippedHorizontal })}
          autoPlay={autoPlay}
          muted={muted}
          playsInline={playsInline}
          onLoadedMetadata={handleLoadedMetadata}
        />
        {showStatistics && <VideoStatistics config={statsConfig} />}
        {showMuted && (
          <Tooltip title="Muted">
            <VolumeMute fontSize="large" className="video__muted-icon" />
          </Tooltip>
        )}
        <VideoActions className="video__actions" onAction={handleAction} />
      </Grid>
    </Grid>
  );
};
