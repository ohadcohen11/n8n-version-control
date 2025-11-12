'use client';

import styled from 'styled-components';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) => props.color || 'var(--primary)'};
    box-shadow: 0 2px 8px var(--shadow);
  }
`;

const StatIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${(props) => props.color}15;
  border: 1px solid ${(props) => props.color}40;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const StatContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
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
      <StatCard color="var(--primary)">
        <StatIcon color="var(--primary)">📊</StatIcon>
        <StatContent>
          <StatValue>{totalWorkflows}</StatValue>
          <StatLabel>Total</StatLabel>
        </StatContent>
      </StatCard>

      <StatCard color="var(--secondary)">
        <StatIcon color="var(--secondary)">✓</StatIcon>
        <StatContent>
          <StatValue>{synced}</StatValue>
          <StatLabel>Synced</StatLabel>
        </StatContent>
      </StatCard>

      <StatCard color="var(--warning)">
        <StatIcon color="var(--warning)">⚠</StatIcon>
        <StatContent>
          <StatValue>{modified}</StatValue>
          <StatLabel>Modified</StatLabel>
        </StatContent>
      </StatCard>

      <StatCard color="var(--danger)">
        <StatIcon color="var(--danger)">↑</StatIcon>
        <StatContent>
          <StatValue>{onlyInN8n}</StatValue>
          <StatLabel>Only n8n</StatLabel>
        </StatContent>
      </StatCard>

      <StatCard color="var(--primary-light)">
        <StatIcon color="var(--primary-light)">↓</StatIcon>
        <StatContent>
          <StatValue>{onlyInGitHub}</StatValue>
          <StatLabel>Only GitHub</StatLabel>
        </StatContent>
      </StatCard>
    </StatsGrid>
  );
}
