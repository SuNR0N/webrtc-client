import React, { FC, useState } from 'react';
import cn from 'classnames';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@material-ui/lab';
import { Flip } from '@material-ui/icons';

enum Action {
  Flip = 'Flip',
}

const actions = [{ icon: <Flip />, name: 'Flip Horizontal', id: Action.Flip }];

interface Props {
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  hidden?: boolean;
  onFlip?: () => void;
}

export const VideoOptions: FC<Props> = ({ className, direction = 'up', hidden = false, onFlip }) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);

  const handleOpen = () => setOpen(true);

  const handleAction = (action: Action) => () => {
    switch (action) {
      case Action.Flip:
        if (onFlip) {
          onFlip();
        }
        break;
      default:
        break;
    }
  };

  return (
    <SpeedDial
      ariaLabel="Video Options"
      className={cn('video-options', className)}
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
