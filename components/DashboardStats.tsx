'use client';

import { Box, Card, CardContent, Typography, Avatar } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

interface DashboardStatsProps {
  totalWorkflows: number;
  synced: number;
  modified: number;
  onlyInN8n: number;
  onlyInGitHub: number;
}

export default function DashboardStats({
  totalWorkflows,
  synced,
  modified,
  onlyInN8n,
  onlyInGitHub,
}: DashboardStatsProps) {
  const stats = [
    {
      value: totalWorkflows,
      label: 'Total Workflows',
      icon: <InventoryIcon />,
      bgColor: 'primary.main',
    },
    {
      value: synced,
      label: 'Synced',
      icon: <CheckCircleIcon />,
      bgColor: 'success.main',
    },
    {
      value: modified,
      label: 'Modified',
      icon: <EditIcon />,
      bgColor: 'warning.main',
    },
    {
      value: onlyInN8n,
      label: 'Only in n8n',
      icon: <CloudUploadIcon />,
      bgColor: 'error.main',
    },
    {
      value: onlyInGitHub,
      label: 'Only in GitHub',
      icon: <CloudDownloadIcon />,
      bgColor: 'info.main',
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(5, 1fr)',
        },
        gap: 2,
        mb: 3,
      }}
    >
      {stats.map((stat, index) => (
        <Card
          key={index}
          sx={{
            height: '100%',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: stat.bgColor,
                  width: 48,
                  height: 48,
                  opacity: 0.9,
                }}
              >
                {stat.icon}
              </Avatar>
            </Box>
            <Typography variant="h4" component="div" sx={{ mb: 0.5, fontWeight: 700 }}>
              {stat.value}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              {stat.label}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
