'use client';

import { Snackbar, Alert, AlertTitle } from '@mui/material';
import { useState, useEffect } from 'react';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ type, title, message, onClose, duration = 4000 }: ToastProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, [type, title, message]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={type} sx={{ minWidth: 300 }} variant="filled" elevation={6}>
        <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>
        {message}
      </Alert>
    </Snackbar>
  );
}
