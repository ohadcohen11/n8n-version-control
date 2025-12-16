'use client';

import { useState } from 'react';
import { Box, Typography, Chip, TextField, IconButton, Alert } from '@mui/material';
import {
  Schedule as ScheduleIcon,
  AccessTime as ClockIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import cronstrue from 'cronstrue';

interface TriggerNode {
  id: string;
  name: string;
  type: string;
  triggerType: 'schedule' | 'manual' | 'webhook' | 'email';
  cronExpression?: string;
  humanReadable?: string;
  scheduleMode?: string;
  scheduleDetails?: string;
}

interface ScheduleTriggerCubeProps {
  trigger: TriggerNode;
  workflowId: string;
  onUpdate?: () => void;
}

export default function ScheduleTriggerCube({ trigger, workflowId, onUpdate }: ScheduleTriggerCubeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCron, setEditedCron] = useState(trigger.cronExpression || '');
  const [previewText, setPreviewText] = useState('');
  const [cronError, setCronError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Don't show if not a schedule trigger
  if (trigger.triggerType !== 'schedule') {
    return null;
  }

  const triggerColor = '#10b981'; // emerald green for schedule triggers

  // Parse cron expression to get human-readable preview
  const parseCronExpression = (cron: string): string => {
    try {
      return cronstrue.toString(cron, { use24HourTimeFormat: true });
    } catch (error) {
      return 'Invalid cron expression';
    }
  };

  const handleCronChange = (value: string) => {
    setEditedCron(value);

    // Try to parse and show preview
    try {
      const preview = parseCronExpression(value);
      setPreviewText(preview);
      setCronError('');
    } catch (error) {
      setPreviewText('');
      setCronError('Invalid cron expression');
    }
  };

  const handleSave = async () => {
    // Validate cron expression before saving
    try {
      parseCronExpression(editedCron);
    } catch (error) {
      setCronError('Invalid cron expression. Please fix before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/update-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          nodeId: trigger.id,
          field: 'cronExpression',
          value: editedCron,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }

      setIsEditing(false);
      setCronError('');

      // Call onUpdate callback to refresh the data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      setCronError('Failed to save schedule. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedCron(trigger.cronExpression || '');
    setPreviewText('');
    setCronError('');
    setIsEditing(false);
  };

  const handleEdit = () => {
    setEditedCron(trigger.cronExpression || '');
    setPreviewText(trigger.humanReadable || '');
    setIsEditing(true);
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
        border: '2px solid rgba(16, 185, 129, 0.4)',
        width: '100%',
        height: 'auto',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          border: '2px solid rgba(16, 185, 129, 0.8)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          transform: 'translateY(-2px)',
        }
      }}
    >
      {/* Title Badge */}
      <Box sx={{ mb: 1.5 }}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${triggerColor} 0%, ${triggerColor}CC 100%)`,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            textAlign: 'center',
            py: 0.75,
            px: 1.5,
            borderRadius: 1.5,
            letterSpacing: '0.5px',
            boxShadow: `0 2px 8px ${triggerColor}50`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, justifyContent: 'center' }}>
            <ScheduleIcon sx={{ fontSize: '1rem' }} />
            SCHEDULE TRIGGER
          </Box>
          {!isEditing && (
            <IconButton
              size="small"
              onClick={handleEdit}
              sx={{
                color: 'white',
                p: 0.5,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
              }}
            >
              <EditIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          )}
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            fontStyle: 'italic',
            fontSize: '0.7rem',
            mt: 0.5,
            textAlign: 'center'
          }}
        >
          {trigger.name}
        </Typography>
      </Box>

      {/* Error Alert */}
      {cronError && (
        <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>
          {cronError}
        </Alert>
      )}

      {/* Human Readable Schedule */}
      {!isEditing && trigger.humanReadable && (
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <ClockIcon sx={{ fontSize: '0.9rem', color: triggerColor }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary' }}>
              SCHEDULE:
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              p: 1.5,
              borderRadius: 1,
              fontSize: '0.85rem',
              color: 'rgba(52, 211, 153, 1)',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {trigger.humanReadable}
          </Box>
        </Box>
      )}

      {/* Cron Expression - Display Mode */}
      {!isEditing && trigger.cronExpression && (
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.5 }}>
            CRON EXPRESSION:
          </Typography>
          <Box
            sx={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              p: 1,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'rgba(226, 232, 240, 0.95)',
              overflowX: 'auto',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {trigger.cronExpression}
          </Box>
        </Box>
      )}

      {/* Cron Expression - Edit Mode */}
      {isEditing && (
        <>
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.5 }}>
              CRON EXPRESSION:
            </Typography>
            <TextField
              fullWidth
              value={editedCron}
              onChange={(e) => handleCronChange(e.target.value)}
              placeholder="0 6-23/3 * * *"
              disabled={isSaving}
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'rgba(226, 232, 240, 0.95)',
                  '&:hover': {
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                  },
                  '&.Mui-focused': {
                    border: '1px solid rgba(16, 185, 129, 0.7)',
                  }
                },
                '& .MuiInputBase-input': {
                  textAlign: 'center',
                  padding: '8px',
                }
              }}
            />
          </Box>

          {/* Preview */}
          {previewText && !cronError && (
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <ClockIcon sx={{ fontSize: '0.9rem', color: triggerColor }} />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary' }}>
                  PREVIEW:
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  p: 1.5,
                  borderRadius: 1,
                  fontSize: '0.85rem',
                  color: 'rgba(52, 211, 153, 1)',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {previewText}
              </Box>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1.5 }}>
            <IconButton
              size="small"
              onClick={handleSave}
              disabled={isSaving || !!cronError || !editedCron}
              sx={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: triggerColor,
                '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.3)' },
                '&:disabled': { opacity: 0.5 }
              }}
            >
              <CheckIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleCancel}
              disabled={isSaving}
              sx={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.3)' },
                '&:disabled': { opacity: 0.5 }
              }}
            >
              <CloseIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Box>
        </>
      )}

      {/* Schedule Mode Chip (if available) */}
      {!isEditing && trigger.scheduleMode && (
        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Chip
            label={trigger.scheduleMode.replace(/([A-Z])/g, ' $1').trim()}
            size="small"
            sx={{
              backgroundColor: `${triggerColor}20`,
              color: triggerColor,
              fontWeight: 600,
              fontSize: '0.65rem',
              textTransform: 'uppercase',
            }}
          />
        </Box>
      )}
    </Box>
  );
}
