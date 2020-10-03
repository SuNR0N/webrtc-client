import React, { FC, useState } from 'react';
import cn from 'classnames';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@material-ui/lab';
import { Assessment, Flip } from '@material-ui/icons';

export enum VideoAction {
  Flip = 'Flip',
  ToggleStatistics = 'ToggleStatistics',
}

const actions = [
  { icon: <Flip />, name: 'Flip Horizontal', id: VideoAction.Flip },
  { icon: <Assessment />, name: 'Toggle Statistics', id: VideoAction.ToggleStatistics },
];

interface Props {
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  hidden?: boolean;
  onAction?: (action: VideoAction) => void;
}

export const VideoActions: FC<Props> = ({ className, direction = 'up', hidden = false, onAction }) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);

  const handleOpen = () => setOpen(true);

  const handleAction = (action: VideoAction) => () => {
    onAction && onAction(action);
  };

  return (
    <SpeedDial
      ariaLabel="Video Options"
      className={cn('video-actions', className)}
      icon={<SpeedDialIcon />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
      hidden={hidden}
      direction={direction}
    >
      {actions.map((action) => (
        <SpeedDialAction key={action.name} icon={action.icon} tooltipTitle={action.name} onClick={handleAction(action.id)} />
      ))}
    </SpeedDial>
  );
};
