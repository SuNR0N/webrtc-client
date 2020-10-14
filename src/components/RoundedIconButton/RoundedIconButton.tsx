import React, { createElement, FC, MouseEvent } from 'react';
import { Fab, SvgIconTypeMap, Tooltip } from '@material-ui/core';
import { OverridableComponent } from '@material-ui/core/OverridableComponent';
import cn from 'classnames';

import { Color } from '../../models';
import './RoundedIconButton.scss';

interface Props {
  color?: Color;
  disabled?: boolean;
  icon: OverridableComponent<SvgIconTypeMap<{}, 'svg'>>;
  iconColor?: Color;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  tooltip?: string;
}

export const RoundedIconButton: FC<Props> = ({ color, disabled, icon, iconColor, onClick, tooltip = '' }) => {
  const IconButton = (
    <Fab
      disabled={disabled}
      onClick={onClick}
      className={cn('rounded-icon-button', {
        [`rounded-icon-button--icon-${iconColor}`]: iconColor,
        [`rounded-icon-button--${color}`]: color,
      })}
    >
      {createElement(icon)}
    </Fab>
  );

  return <Tooltip title={tooltip}>{disabled ? <span>{IconButton}</span> : IconButton}</Tooltip>;
};
