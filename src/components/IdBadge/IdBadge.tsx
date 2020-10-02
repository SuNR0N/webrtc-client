import React, { FC } from 'react';
import { Avatar, Chip } from '@material-ui/core';
import cn from 'classnames';

interface Props {
  avatarText?: string;
  className?: string;
  enableCopy?: boolean;
  id: string;
  imgSrc?: string;
}

export const IdBadge: FC<Props> = ({ avatarText = 'ID', className, enableCopy = true, id, imgSrc }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(id);
  };

  return (
    <Chip
      className={cn('id-badge', className)}
      onClick={enableCopy && navigator.clipboard.writeText ? handleCopy : undefined}
      avatar={imgSrc ? <Avatar src={imgSrc} /> : <Avatar>{avatarText}</Avatar>}
      label={id}
      color="primary"
      variant="outlined"
    />
  );
};
