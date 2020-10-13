import React, { FC } from 'react';
import { Grid } from '@material-ui/core';
import { Call, CallEnd } from '@material-ui/icons';
import cn from 'classnames';

import { RoundedIconButton } from '../RoundedIconButton/RoundedIconButton';
import { IdBadge } from '../IdBadge/IdBadge';
import './IncomingConnectionControls.scss';

interface Props {
  className?: string;
  id: string;
  onAccept?: () => void;
  onDecline?: () => void;
}

export const IncomingConnectionControls: FC<Props> = ({ className, id, onAccept, onDecline }) => (
  <Grid className={cn('incoming-connection-controls', className)} container spacing={5} justify="center">
    <Grid container item xs={12} justify="center">
      <IdBadge className="incoming-connection-controls__id-badge" id={id} />
    </Grid>
    <Grid item>
      <RoundedIconButton color="success" icon={Call} tooltip="Accept" onClick={onAccept}></RoundedIconButton>
    </Grid>
    <Grid item>
      <RoundedIconButton color="error" icon={CallEnd} tooltip="Decline" onClick={onDecline}></RoundedIconButton>
    </Grid>
  </Grid>
);
