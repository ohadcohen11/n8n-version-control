'use client';

import {
  Stack,
  Paper,
  Avatar,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import CommitIcon from '@mui/icons-material/Commit';

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author?: {
    login: string;
    avatar_url: string;
  };
}

interface CommitsViewProps {
  commits: Commit[];
}

export default function CommitsView({ commits }: CommitsViewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (commits.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>📭</Typography>
        <Typography color="text.secondary">No commits found</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {commits.map((commit) => (
        <Paper
          key={commit.sha}
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            {getInitials(commit.commit.author.name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }} noWrap>
              {commit.commit.message.split('\n')[0]}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                {commit.author?.login || commit.commit.author.name}
              </Typography>
              <Chip
                icon={<CommitIcon sx={{ fontSize: 14 }} />}
                label={commit.sha.slice(0, 7)}
                size="small"
                sx={{ fontSize: '0.75rem', height: 24 }}
              />
              <Typography variant="body2" color="text.secondary">
                {formatDate(commit.commit.author.date)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}
