'use client';

import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import WorkflowIcon from '@mui/icons-material/AccountTree';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <WorkflowIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            n8n Git Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            Workflow Sync Manager
          </Typography>
          <GitHubIcon sx={{ ml: 2 }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="body2" color="text.secondary" align="center">
            n8n Git Dashboard - Sync your workflows with GitHub
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
