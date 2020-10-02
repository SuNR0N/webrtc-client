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
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  tooltip?: string;
}

export const RoundedIconButton: FC<Props> = ({ color = 'primary', disabled, icon, onClick, tooltip = '' }) => (
  <Tooltip title={tooltip}>
    <Fab disabled={disabled} onClick={onClick} className={cn('rounded-icon-button', `rounded-icon-button--${color}`)}>
      {createElement(icon)}
    </Fab>
  </Tooltip>
);
