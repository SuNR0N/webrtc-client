import React, { FC, useEffect, useState } from 'react';
import cn from 'classnames';
import { Box, Chip, Grid } from '@material-ui/core';

import './Video.scss';

interface Props {
  autoPlay?: boolean;
  className?: string;
  id?: string;
  muted?: boolean;
  playsInline?: boolean;
  stream?: MediaStream;
}

export const Video: FC<Props> = ({ autoPlay = true, className, id, muted = false, playsInline = true, stream }) => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (stream && videoElement) {
      videoElement.srcObject = stream;
    }
  }, [stream, videoElement]);

  return (
    <Grid container className={cn('video', className)}>
      {id && (
        <Grid container item xs={12} justify="center">
          <Box mb={1}>
            ID: <Chip label={id} variant="outlined" />
          </Box>
        </Grid>
      )}
      <Grid container item xs={12} justify="center">
        <video ref={(ref) => setVideoElement(ref)} className="video__frame" autoPlay={autoPlay} muted={muted} playsInline={playsInline} />
      </Grid>
    </Grid>
  );
};
