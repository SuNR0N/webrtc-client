import React, { FC, useEffect, useState } from 'react';
import cn from 'classnames';
import { Avatar, Box, Chip, Grid } from '@material-ui/core';

import { VideoOptions } from '../';
import './Video.scss';

interface Props {
  autoPlay?: boolean;
  className?: string;
  flipHorizontal?: boolean;
  id?: string;
  muted?: boolean;
  playsInline?: boolean;
  stream?: MediaStream;
}

export const Video: FC<Props> = ({ autoPlay = true, className, id, flipHorizontal = false, muted = false, playsInline = true, stream }) => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [flippedHorizontal, setFlippedHorizontal] = useState(flipHorizontal);

  useEffect(() => {
    if (stream && videoElement) {
      videoElement.srcObject = stream;
    }
  }, [stream, videoElement]);

  const handleFlip = () => {
    setFlippedHorizontal(!flippedHorizontal);
  };

  return (
    <Grid container className={cn('video', className)}>
      {id && (
        <Grid container item xs={12} justify="center">
          <Box mb={1}>
            <Chip avatar={<Avatar>ID</Avatar>} label={id} color="primary" variant="outlined" />
          </Box>
        </Grid>
      )}
      <Grid className="video__wrapper" container item xs={12} justify="center">
        <video
          ref={(ref) => setVideoElement(ref)}
          className={cn('video__frame', { 'video__frame--flipped-horizontal': flippedHorizontal })}
          autoPlay={autoPlay}
          muted={muted}
          playsInline={playsInline}
        />
        <VideoOptions className="video__options" onFlip={handleFlip} />
      </Grid>
    </Grid>
  );
};
