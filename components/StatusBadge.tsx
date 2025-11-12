'use client';

import styled from 'styled-components';

interface BadgeProps {
  status: 'synced' | 'modified' | 'only_in_n8n' | 'only_in_github' | 'error';
}

const getBadgeColor = (status: BadgeProps['status']) => {
  switch (status) {
    case 'synced':
      return 'var(--secondary)';
    case 'modified':
      return 'var(--warning)';
    case 'only_in_n8n':
      return 'var(--primary)';
    case 'only_in_github':
      return 'var(--primary-light)';
    case 'error':
      return 'var(--danger)';
    default:
      return 'var(--text-muted)';
  }
};

const getBadgeText = (status: BadgeProps['status']) => {
  switch (status) {
    case 'synced':
      return 'Synced';
    case 'modified':
      return 'Modified';
    case 'only_in_n8n':
      return 'Only in n8n';
    case 'only_in_github':
      return 'Only in GitHub';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
};

const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 6px;
  background: ${(props) => getBadgeColor(props.status)}22;
  color: ${(props) => getBadgeColor(props.status)};
  border: 1px solid ${(props) => getBadgeColor(props.status)}44;

  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${(props) => getBadgeColor(props.status)};
  }
`;

export default function StatusBadge({ status }: BadgeProps) {
  return <Badge status={status}>{getBadgeText(status)}</Badge>;
}
