'use client';

import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import StatusBadge from './StatusBadge';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';
import CommitModal from './CommitModal';

interface Comparison {
  workflowId: string | null;
  workflowName: string;
  filename: string;
  status: 'synced' | 'modified' | 'only_in_n8n' | 'only_in_github';
  diff: string | null;
  inGitHub: boolean;
  inN8n: boolean;
}

interface DiffViewerProps {
  comparisons: Comparison[];
  onSync?: () => void;
}

export default function DiffViewer({ comparisons, onSync }: DiffViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [syncing, setSyncing] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    comparison: Comparison | null;
    action: 'pull' | 'push' | null;
  }>({ isOpen: false, comparison: null, action: null });
  const [commitModal, setCommitModal] = useState<{
    isOpen: boolean;
    comparison: Comparison | null;
  }>({ isOpen: false, comparison: null });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    comparison: Comparison | null;
    deleteFrom: 'n8n' | 'github' | 'both' | null;
  }>({ isOpen: false, comparison: null, deleteFrom: null });

  const handlePullClick = (comparison: Comparison, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, comparison, action: 'pull' });
  };

  const handlePushClick = (comparison: Comparison, e: React.MouseEvent) => {
    e.stopPropagation();
    setCommitModal({ isOpen: true, comparison });
  };

  const handleConfirmAction = async () => {
    const { comparison, action } = confirmModal;
    if (!comparison || !action) return;

    if (action === 'pull') {
      await handlePull(comparison);
    }
  };

  const handleCommitConfirm = async (commitMessage: string) => {
    const { comparison } = commitModal;
    if (!comparison) return;

    await handlePush(comparison, commitMessage);
  };

  const handlePull = async (comparison: Comparison) => {
    setSyncing(comparison.filename);

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: comparison.filename,
          workflowId: comparison.workflowId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          type: 'success',
          title: 'Workflow Synced',
          message: `Successfully synced "${comparison.workflowName}" from GitHub to n8n`,
        });
        if (onSync) onSync();
      } else {
        setToast({
          type: 'error',
          title: 'Sync Failed',
          message: data.details || data.error,
        });
      }
    } catch (error) {
      console.error('Error syncing workflow:', error);
      setToast({
        type: 'error',
        title: 'Sync Failed',
        message: 'An unexpected error occurred. Check console for details.',
      });
    } finally {
      setSyncing(null);
      setConfirmModal({ isOpen: false, comparison: null, action: null });
    }
  };

  const handlePush = async (comparison: Comparison, commitMessage: string) => {
    if (!comparison.workflowId) return;

    setSyncing(comparison.filename);

    try {
      const response = await fetch('/api/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId: comparison.workflowId,
          filename: comparison.filename,
          commitMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          type: 'success',
          title: 'Pushed to GitHub',
          message: `Successfully pushed "${comparison.workflowName}" to GitHub`,
        });
        if (onSync) onSync();
      } else {
        setToast({
          type: 'error',
          title: 'Push Failed',
          message: data.details || data.error,
        });
      }
    } catch (error) {
      console.error('Error pushing workflow:', error);
      setToast({
        type: 'error',
        title: 'Push Failed',
        message: 'An unexpected error occurred. Check console for details.',
      });
    } finally {
      setSyncing(null);
    }
  };

  const handleDeleteClick = (
    comparison: Comparison,
    deleteFrom: 'n8n' | 'github' | 'both',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, comparison, deleteFrom });
  };

  const handleConfirmDelete = async () => {
    const { comparison, deleteFrom } = deleteModal;
    if (!comparison || !deleteFrom) return;

    setSyncing(comparison.filename);

    try {
      let success = true;
      let errorMessage = '';

      if ((deleteFrom === 'n8n' || deleteFrom === 'both') && comparison.workflowId) {
        const response = await fetch('/api/delete-workflow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflowId: comparison.workflowId,
          }),
        });

        const data = await response.json();
        if (!data.success) {
          success = false;
          errorMessage = data.details || data.error;
        }
      }

      if (success && (deleteFrom === 'github' || deleteFrom === 'both') && comparison.inGitHub) {
        const response = await fetch('/api/delete-github-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: comparison.filename,
            commitMessage: `Remove workflow: ${comparison.workflowName}`,
          }),
        });

        const data = await response.json();
        if (!data.success) {
          success = false;
          errorMessage = data.details || data.error;
        }
      }

      if (success) {
        const location =
          deleteFrom === 'both'
            ? 'n8n and GitHub'
            : deleteFrom === 'n8n'
            ? 'n8n'
            : 'GitHub';
        setToast({
          type: 'success',
          title: 'Workflow Deleted',
          message: `Successfully deleted "${comparison.workflowName}" from ${location}`,
        });
        if (onSync) onSync();
      } else {
        setToast({
          type: 'error',
          title: 'Delete Failed',
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'An unexpected error occurred. Check console for details.',
      });
    } finally {
      setSyncing(null);
      setDeleteModal({ isOpen: false, comparison: null, deleteFrom: null });
    }
  };

  const filteredComparisons = comparisons.filter((comp) => {
    if (filter === 'all') return true;
    return comp.status === filter;
  });

  const formatDiff = (diff: string) => {
    return diff.split('\n').map((line, index) => {
      let color = 'text.primary';
      let bgcolor = 'transparent';

      if (line.startsWith('+') && !line.startsWith('+++')) {
        color = '#6ee7b7';
        bgcolor = 'rgba(16, 185, 129, 0.15)';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        color = '#fca5a5';
        bgcolor = 'rgba(239, 68, 68, 0.15)';
      } else if (line.startsWith('@@')) {
        color = 'primary.light';
      } else if (line.startsWith('---') || line.startsWith('+++')) {
        color = 'text.secondary';
      }

      return (
        <Box
          key={index}
          component="span"
          sx={{
            display: 'block',
            px: 1,
            py: 0.25,
            color,
            bgcolor,
          }}
        >
          {line || '\u00A0'}
        </Box>
      );
    });
  };

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Pull Workflow from GitHub"
        message={`Are you sure you want to pull "${confirmModal.comparison?.workflowName}" from GitHub to n8n? This will overwrite the current version in n8n.`}
        confirmText="↓ Pull from GitHub"
        cancelText="Cancel"
        variant="warning"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, comparison: null, action: null })}
      />
      <CommitModal
        isOpen={commitModal.isOpen}
        workflowName={commitModal.comparison?.workflowName || ''}
        defaultMessage={
          commitModal.comparison?.status === 'only_in_n8n'
            ? `Add workflow: ${commitModal.comparison?.workflowName || 'workflow'}`
            : `Update workflow: ${commitModal.comparison?.workflowName || 'workflow'}`
        }
        onConfirm={handleCommitConfirm}
        onCancel={() => setCommitModal({ isOpen: false, comparison: null })}
      />
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Workflow"
        message={`Are you sure you want to delete "${deleteModal.comparison?.workflowName}" from ${
          deleteModal.deleteFrom === 'both'
            ? 'both n8n and GitHub'
            : deleteModal.deleteFrom === 'n8n'
            ? 'n8n'
            : 'GitHub'
        }? This action cannot be undone.`}
        confirmText="🗑️ Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, comparison: null, deleteFrom: null })}
      />

      <ButtonGroup variant="outlined" sx={{ mb: 3 }} size="small">
        <Button
          variant={filter === 'all' ? 'contained' : 'outlined'}
          onClick={() => setFilter('all')}
        >
          All ({comparisons.length})
        </Button>
        <Button
          variant={filter === 'synced' ? 'contained' : 'outlined'}
          onClick={() => setFilter('synced')}
        >
          Synced ({comparisons.filter((c) => c.status === 'synced').length})
        </Button>
        <Button
          variant={filter === 'modified' ? 'contained' : 'outlined'}
          onClick={() => setFilter('modified')}
        >
          Modified ({comparisons.filter((c) => c.status === 'modified').length})
        </Button>
        <Button
          variant={filter === 'only_in_n8n' ? 'contained' : 'outlined'}
          onClick={() => setFilter('only_in_n8n')}
        >
          Only in n8n ({comparisons.filter((c) => c.status === 'only_in_n8n').length})
        </Button>
        <Button
          variant={filter === 'only_in_github' ? 'contained' : 'outlined'}
          onClick={() => setFilter('only_in_github')}
        >
          Only in GitHub ({comparisons.filter((c) => c.status === 'only_in_github').length})
        </Button>
      </ButtonGroup>

      <Stack spacing={2}>
        {filteredComparisons.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>🎉</Typography>
            <Typography color="text.secondary">
              No workflows found with the selected filter
            </Typography>
          </Box>
        ) : (
          filteredComparisons.map((comparison) => (
            <Paper
              key={comparison.filename}
              sx={{
                p: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 2,
                },
              }}
              onClick={() =>
                setExpandedId(
                  expandedId === comparison.filename ? null : comparison.filename
                )
              }
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }} noWrap>
                    {comparison.workflowName}
                  </Typography>
                  <StatusBadge status={comparison.status} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  {(comparison.status === 'modified' || comparison.status === 'only_in_github') && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CloudDownloadIcon />}
                      onClick={(e) => handlePullClick(comparison, e)}
                      disabled={syncing === comparison.filename}
                    >
                      {syncing === comparison.filename ? 'Syncing...' : 'Pull'}
                    </Button>
                  )}

                  {(comparison.status === 'modified' || comparison.status === 'only_in_n8n') && comparison.workflowId && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CloudUploadIcon />}
                      onClick={(e) => handlePushClick(comparison, e)}
                      disabled={syncing === comparison.filename}
                    >
                      {syncing === comparison.filename ? 'Syncing...' : 'Push'}
                    </Button>
                  )}

                  {comparison.status === 'only_in_n8n' && comparison.workflowId && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => handleDeleteClick(comparison, 'n8n', e)}
                      disabled={syncing === comparison.filename}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}

                  {comparison.status === 'only_in_github' && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => handleDeleteClick(comparison, 'github', e)}
                      disabled={syncing === comparison.filename}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}

                  {(comparison.status === 'synced' || comparison.status === 'modified') && comparison.workflowId && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => handleDeleteClick(comparison, 'both', e)}
                      disabled={syncing === comparison.filename}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}

                  <IconButton size="small">
                    {expandedId === comparison.filename ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
              </Box>

              <Collapse in={expandedId === comparison.filename}>
                {comparison.diff ? (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: 'background.default',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 500,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                    }}
                  >
                    {formatDiff(comparison.diff)}
                  </Box>
                ) : comparison.status === 'synced' ? (
                  <Box sx={{ mt: 2, p: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      ✓ This workflow is in sync
                    </Typography>
                  </Box>
                ) : null}
              </Collapse>
            </Paper>
          ))
        )}
      </Stack>
    </>
  );
}
