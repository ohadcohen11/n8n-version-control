'use client';

import styled from 'styled-components';
import { Card } from './Card';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
`;

const StatIcon = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${(props) => props.color}22;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
`;

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
  return (
    <StatsGrid>
      <StatCard>
        <StatIcon color="var(--primary)">📊</StatIcon>
        <StatValue>{totalWorkflows}</StatValue>
        <StatLabel>Total Workflows</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon color="var(--secondary)">✓</StatIcon>
        <StatValue>{synced}</StatValue>
        <StatLabel>Synced</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon color="var(--warning)">⚠</StatIcon>
        <StatValue>{modified}</StatValue>
        <StatLabel>Modified</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon color="var(--danger)">↑</StatIcon>
        <StatValue>{onlyInN8n}</StatValue>
        <StatLabel>Only in n8n</StatLabel>
      </StatCard>

      <StatCard>
        <StatIcon color="var(--primary-light)">↓</StatIcon>
        <StatValue>{onlyInGitHub}</StatValue>
        <StatLabel>Only in GitHub</StatLabel>
      </StatCard>
    </StatsGrid>
  );
}
