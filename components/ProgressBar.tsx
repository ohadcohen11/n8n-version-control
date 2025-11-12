'use client';

import { Box, LinearProgress, Typography, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { keyframes } from '@mui/material/styles';

interface ProgressStep {
  label: string;
  status: 'pending' | 'loading' | 'complete';
}

interface ProgressBarProps {
  steps: ProgressStep[];
  currentStep: number;
  total: number;
}

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export default function ProgressBar({ steps, currentStep, total }: ProgressBarProps) {
  const progress = total > 0 ? (currentStep / total) * 100 : 0;
  const percentage = Math.round(progress);

  const getStepIcon = (status: 'pending' | 'loading' | 'complete') => {
    if (status === 'complete') {
      return <CheckCircleIcon sx={{ fontSize: 16 }} />;
    }
    if (status === 'loading') {
      return (
        <Box
          sx={{
            animation: `${spin} 1s linear infinite`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ⟳
        </Box>
      );
    }
    return <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} />;
  };

  const getStepColor = (status: 'pending' | 'loading' | 'complete') => {
    switch (status) {
      case 'complete':
        return 'success';
      case 'loading':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 64,
        left: 0,
        right: 0,
        zIndex: 2000,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        p: 3,
        boxShadow: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="body1" fontWeight={600}>
          Loading Dashboard...
        </Typography>
        <Typography variant="body1" fontWeight={600} color="primary">
          {percentage}%
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 1,
          mb: 2,
          bgcolor: 'action.hover',
        }}
      />

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {steps.map((step, index) => (
          <Chip
            key={index}
            icon={getStepIcon(step.status)}
            label={step.label}
            color={getStepColor(step.status)}
            variant={step.status === 'pending' ? 'outlined' : 'filled'}
            size="small"
            sx={{ fontSize: '0.8125rem' }}
          />
        ))}
      </Box>
    </Box>
  );
}
