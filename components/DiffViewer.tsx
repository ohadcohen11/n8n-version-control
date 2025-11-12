'use client';

import styled from 'styled-components';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import StatusBadge from './StatusBadge';
import { Button } from './Button';

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
}

export default function DiffViewer({ comparisons }: DiffViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

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
                  <span>{comparison.filename}</span>
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
