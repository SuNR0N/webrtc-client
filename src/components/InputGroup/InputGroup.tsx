import React, { ChangeEvent, FC } from 'react';
import { Button, FormControl, InputAdornment, InputLabel, OutlinedInput } from '@material-ui/core';
import cn from 'classnames';

import './InputGroup.scss';

interface Props {
  buttonColor: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  buttonText: string;
  className?: string;
  disabled: boolean;
  id: string;
  label: string;
  name: string;
  onButtonClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: any;
}

export const InputGroup: FC<Props> = ({
  buttonColor = 'primary',
  buttonText,
  className,
  disabled = false,
  id,
  label,
  name,
  onButtonClick,
  onChange,
  value,
}) => (
  <FormControl className={cn('input-group', className)} fullWidth variant="outlined">
    <InputLabel htmlFor={id}>{label}</InputLabel>
    <OutlinedInput
      disabled={disabled}
      label={label}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      endAdornment={
        <InputAdornment position="end">
          <Button className={cn('input-group__button', `input-group__button--${buttonColor}`)} disabled={disabled} onClick={onButtonClick}>
            {buttonText}
          </Button>
        </InputAdornment>
      }
    />
  </FormControl>
);
