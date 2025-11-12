'use client';

import styled from 'styled-components';

export const Card = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px var(--shadow);
  }
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
`;

export const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
`;

export const CardContent = styled.div`
  color: var(--text-secondary);
`;
