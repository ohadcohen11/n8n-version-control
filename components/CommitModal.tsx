'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  Box,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useState, useEffect } from 'react';

interface CommitModalProps {
  isOpen: boolean;
  workflowName: string;
  defaultMessage: string;
  onConfirm: (commitMessage: string) => void;
  onCancel: () => void;
}

export default function CommitModal({
  isOpen,
  workflowName,
  defaultMessage,
  onConfirm,
  onCancel,
}: CommitModalProps) {
  const [message, setMessage] = useState(defaultMessage);

  useEffect(() => {
    if (isOpen) {
      setMessage(defaultMessage);
    }
  }, [isOpen, defaultMessage]);

  const handleConfirm = () => {
    if (message.trim()) {
      onConfirm(message.trim());
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleConfirm();
    }
  };

  const isOver72 = message.length > 72;

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3, pb: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          <SaveIcon />
        </Avatar>
        <DialogTitle sx={{ p: 0, flex: 1 }}>Commit to GitHub</DialogTitle>
      </Box>
      <DialogContent>
        <TextField
          label="Workflow"
          value={workflowName}
          disabled
          fullWidth
          margin="normal"
          variant="outlined"
        />

        <TextField
          label="Commit Message *"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Update workflow configuration"
          fullWidth
          margin="normal"
          variant="outlined"
          autoFocus
          inputProps={{ maxLength: 100 }}
          helperText={
            <>
              <Typography
                component="span"
                variant="caption"
                color={isOver72 ? 'error' : 'text.secondary'}
              >
                {message.length}/100 characters
                {isOver72 && ' (recommended: 72 or less)'}
              </Typography>
              <br />
              <Typography component="span" variant="caption" color="text.secondary">
                💡 Tip: Press Cmd/Ctrl + Enter to commit quickly
              </Typography>
            </>
          }
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onCancel} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!message.trim()}
          autoFocus
        >
          ↑ Push to GitHub
        </Button>
      </DialogActions>
    </Dialog>
  );
}
