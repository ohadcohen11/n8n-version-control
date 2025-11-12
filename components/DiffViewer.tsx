'use client';

import styled from 'styled-components';
import { useState } from 'react';
import StatusBadge from './StatusBadge';
import { Button } from './Button';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';
import CommitModal from './CommitModal';

const SyncButton = styled(Button)`
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
`;

const WorkflowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const WorkflowItem = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
    background: var(--bg-secondary);
    box-shadow: 0 1px 4px var(--shadow);
  }
`;

const WorkflowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const WorkflowName = styled.h3`
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const WorkflowMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
  flex-shrink: 0;
`;

const DiffContent = styled.pre`
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.6;
  max-height: 500px;
  overflow-y: auto;

  .diff-line {
    display: block;
    padding: 0.125rem 0.5rem;
    margin: 0 -0.5rem;
  }

  .diff-added {
    background: rgba(16, 185, 129, 0.15);
    color: #6ee7b7;
  }

  .diff-removed {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
  }

  .diff-info {
    color: var(--primary-light);
    font-weight: 600;
  }

  .diff-header {
    color: var(--text-muted);
    font-weight: 600;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
`;

const FilterBar = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

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
    // Open commit message modal instead of confirm modal
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

      // Delete from n8n if needed
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

      // Delete from GitHub if needed
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
      let className = 'diff-line';
      if (line.startsWith('+') && !line.startsWith('+++')) {
        className += ' diff-added';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        className += ' diff-removed';
      } else if (line.startsWith('@@')) {
        className += ' diff-info';
      } else if (line.startsWith('---') || line.startsWith('+++')) {
        className += ' diff-header';
      }
      return (
        <span key={index} className={className}>
          {line || '\n'}
        </span>
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
      <FilterBar>
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setFilter('all')}
        >
          All ({comparisons.length})
        </Button>
        <Button
          variant={filter === 'synced' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setFilter('synced')}
        >
          Synced ({comparisons.filter((c) => c.status === 'synced').length})
        </Button>
        <Button
          variant={filter === 'modified' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setFilter('modified')}
        >
          Modified ({comparisons.filter((c) => c.status === 'modified').length})
        </Button>
        <Button
          variant={filter === 'only_in_n8n' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setFilter('only_in_n8n')}
        >
          Only in n8n ({comparisons.filter((c) => c.status === 'only_in_n8n').length})
        </Button>
        <Button
          variant={filter === 'only_in_github' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setFilter('only_in_github')}
        >
          Only in GitHub ({comparisons.filter((c) => c.status === 'only_in_github').length})
        </Button>
      </FilterBar>

      <WorkflowList>
        {filteredComparisons.length === 0 ? (
          <EmptyState>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <div>No workflows found with the selected filter</div>
          </EmptyState>
        ) : (
          filteredComparisons.map((comparison) => (
            <WorkflowItem
              key={comparison.filename}
              onClick={() =>
                setExpandedId(
                  expandedId === comparison.filename ? null : comparison.filename
                )
              }
            >
              <WorkflowHeader>
                <WorkflowName>{comparison.workflowName}</WorkflowName>
                <WorkflowMeta>
                  <StatusBadge status={comparison.status} />

                  {/* Pull from GitHub button - for modified or only_in_github */}
                  {(comparison.status === 'modified' || comparison.status === 'only_in_github') && (
                    <SyncButton
                      onClick={(e) => handlePullClick(comparison, e)}
                      disabled={syncing === comparison.filename}
                      variant="secondary"
                      size="small"
                    >
                      {syncing === comparison.filename ? 'Syncing...' : '↓ Pull from GitHub'}
                    </SyncButton>
                  )}

                  {/* Push to GitHub button - for modified or only_in_n8n */}
                  {(comparison.status === 'modified' || comparison.status === 'only_in_n8n') && comparison.workflowId && (
                    <SyncButton
                      onClick={(e) => handlePushClick(comparison, e)}
                      disabled={syncing === comparison.filename}
                      variant="primary"
                      size="small"
                    >
                      {syncing === comparison.filename ? 'Syncing...' : '↑ Push to GitHub'}
                    </SyncButton>
                  )}

                  {/* Delete button for only_in_n8n */}
                  {comparison.status === 'only_in_n8n' && comparison.workflowId && (
                    <SyncButton
                      onClick={(e) => handleDeleteClick(comparison, 'n8n', e)}
                      disabled={syncing === comparison.filename}
                      variant="secondary"
                      size="small"
                      style={{ color: 'var(--danger)' }}
                    >
                      {syncing === comparison.filename ? 'Deleting...' : '🗑️ Delete from n8n'}
                    </SyncButton>
                  )}

                  {/* Delete button for only_in_github */}
                  {comparison.status === 'only_in_github' && (
                    <SyncButton
                      onClick={(e) => handleDeleteClick(comparison, 'github', e)}
                      disabled={syncing === comparison.filename}
                      variant="secondary"
                      size="small"
                      style={{ color: 'var(--danger)' }}
                    >
                      {syncing === comparison.filename ? 'Deleting...' : '🗑️ Delete from GitHub'}
                    </SyncButton>
                  )}

                  {/* Delete button for synced workflows */}
                  {(comparison.status === 'synced' || comparison.status === 'modified') && comparison.workflowId && (
                    <SyncButton
                      onClick={(e) => handleDeleteClick(comparison, 'both', e)}
                      disabled={syncing === comparison.filename}
                      variant="secondary"
                      size="small"
                      style={{ color: 'var(--danger)' }}
                    >
                      {syncing === comparison.filename ? 'Deleting...' : '🗑️ Delete'}
                    </SyncButton>
                  )}
                </WorkflowMeta>
              </WorkflowHeader>

              {expandedId === comparison.filename && comparison.diff && (
                <DiffContent>{formatDiff(comparison.diff)}</DiffContent>
              )}

              {expandedId === comparison.filename &&
                !comparison.diff &&
                comparison.status === 'synced' && (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                    }}
                  >
                    ✓ This workflow is in sync
                  </div>
                )}
            </WorkflowItem>
          ))
        )}
      </WorkflowList>
    </>
  );
}
