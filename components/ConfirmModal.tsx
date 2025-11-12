'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Avatar,
  Box,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getColor = () => {
    switch (variant) {
      case 'danger':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      default:
        return 'info.main';
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3, pb: 2 }}>
        <Avatar sx={{ bgcolor: getColor(), width: 56, height: 56 }}>
          {getIcon()}
        </Avatar>
        <DialogTitle sx={{ p: 0, flex: 1 }}>{title}</DialogTitle>
      </Box>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onCancel} variant="outlined">
          {cancelText}
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onCancel();
          }}
          variant="contained"
          color={variant === 'danger' ? 'error' : variant === 'warning' ? 'warning' : 'primary'}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
