'use client';

import { Box, Typography, Paper, Chip } from '@mui/material';
import { Schedule as ScheduleIcon, AccessTime as ClockIcon } from '@mui/icons-material';

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
}

export default function ScheduleTriggerCube({ trigger, workflowId }: ScheduleTriggerCubeProps) {
  // Don't show if not a schedule trigger
  if (trigger.triggerType !== 'schedule') {
    return null;
  }

  const triggerColor = '#10b981'; // emerald green for schedule triggers

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${triggerColor}15 0%, ${triggerColor}08 100%)`,
        border: `2px solid ${triggerColor}40`,
        width: '100%',
        height: 'auto',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          border: `2px solid ${triggerColor}`,
          boxShadow: `0 4px 12px ${triggerColor}30`,
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
            justifyContent: 'center',
            gap: 0.5,
          }}
        >
          <ScheduleIcon sx={{ fontSize: '1rem' }} />
          SCHEDULE TRIGGER
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

      {/* Human Readable Schedule */}
      {trigger.humanReadable && (
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <ClockIcon sx={{ fontSize: '0.9rem', color: triggerColor }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary' }}>
              SCHEDULE:
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              p: 1.5,
              borderRadius: 1,
              fontSize: '0.85rem',
              color: triggerColor,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {trigger.humanReadable}
          </Box>
        </Box>
      )}

      {/* Cron Expression */}
      {trigger.cronExpression && (
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.5 }}>
            CRON EXPRESSION:
          </Typography>
          <Box
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              p: 1,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'text.primary',
              overflowX: 'auto',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {trigger.cronExpression}
          </Box>
        </Box>
      )}

      {/* Schedule Mode Chip (if available) */}
      {trigger.scheduleMode && (
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
    </Paper>
  );
}
