'use client';

import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ErrorIcon from '@mui/icons-material/Error';

interface BadgeProps {
  status: 'synced' | 'modified' | 'only_in_n8n' | 'only_in_github' | 'error';
}

const getStatusConfig = (status: BadgeProps['status']) => {
  switch (status) {
    case 'synced':
      return {
        label: 'Synced',
        color: 'success' as const,
        icon: <CheckCircleIcon />,
      };
    case 'modified':
      return {
        label: 'Modified',
        color: 'warning' as const,
        icon: <EditIcon />,
      };
    case 'only_in_n8n':
      return {
        label: 'Only in n8n',
        color: 'primary' as const,
        icon: <CloudUploadIcon />,
      };
    case 'only_in_github':
      return {
        label: 'Only in GitHub',
        color: 'info' as const,
        icon: <CloudDownloadIcon />,
      };
    case 'error':
      return {
        label: 'Error',
        color: 'error' as const,
        icon: <ErrorIcon />,
      };
    default:
      return {
        label: 'Unknown',
        color: 'default' as const,
        icon: undefined,
      };
  }
};

export default function StatusBadge({ status }: BadgeProps) {
  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      color={config.color}
      icon={config.icon}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
}
