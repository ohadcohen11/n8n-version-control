'use client';

import styled from 'styled-components';
import { ReactNode } from 'react';

const LayoutWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 8px var(--shadow);
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    border-radius: 2px;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
`;

const Subtitle = styled.span`
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 400;
`;

const Main = styled.main`
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
`;

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <LayoutWrapper>
      <Header>
        <HeaderContent>
          <div>
            <Title>
              n8n Git Dashboard
              <Subtitle>/ workflow sync manager</Subtitle>
            </Title>
          </div>
        </HeaderContent>
      </Header>
      <Main>{children}</Main>
    </LayoutWrapper>
  );
}
