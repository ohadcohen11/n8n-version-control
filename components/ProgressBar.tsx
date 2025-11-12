'use client';

import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const ProgressContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3000;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 1rem 2rem;
  box-shadow: 0 2px 8px var(--shadow);
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const ProgressTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
`;

const ProgressPercentage = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
`;

const ProgressBarWrapper = styled.div`
  width: 100%;
  height: 8px;
  background: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.75rem;
`;

const ProgressBarFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${(props) => props.progress}%;
  background: linear-gradient(
    90deg,
    var(--primary) 0%,
    var(--primary-light) 50%,
    var(--primary) 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 2s infinite;
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const StepsList = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Step = styled.div<{ status: 'pending' | 'loading' | 'complete' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: ${(props) => {
    switch (props.status) {
      case 'complete':
        return 'var(--secondary)';
      case 'loading':
        return 'var(--primary)';
      default:
        return 'var(--text-muted)';
    }
  }};
`;

const StepIcon = styled.div<{ status: 'pending' | 'loading' | 'complete' }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  background: ${(props) => {
    switch (props.status) {
      case 'complete':
        return 'var(--secondary)';
      case 'loading':
        return 'var(--primary)';
      default:
        return 'var(--bg-tertiary)';
    }
  }};
  color: var(--text-primary);

  ${(props) =>
    props.status === 'loading' &&
    `
    animation: pulse 1.5s ease-in-out infinite;
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
  `}
`;

interface ProgressStep {
  label: string;
  status: 'pending' | 'loading' | 'complete';
}

interface ProgressBarProps {
  steps: ProgressStep[];
  currentStep: number;
  total: number;
}

export default function ProgressBar({ steps, currentStep, total }: ProgressBarProps) {
  const progress = total > 0 ? (currentStep / total) * 100 : 0;
  const percentage = Math.round(progress);

  const getStepIcon = (status: 'pending' | 'loading' | 'complete') => {
    switch (status) {
      case 'complete':
        return '✓';
      case 'loading':
        return '⟳';
      default:
        return '○';
    }
  };

  return (
    <ProgressContainer>
      <ProgressHeader>
        <ProgressTitle>Loading Dashboard...</ProgressTitle>
        <ProgressPercentage>{percentage}%</ProgressPercentage>
      </ProgressHeader>
      <ProgressBarWrapper>
        <ProgressBarFill progress={progress} />
      </ProgressBarWrapper>
      <StepsList>
        {steps.map((step, index) => (
          <Step key={index} status={step.status}>
            <StepIcon status={step.status}>{getStepIcon(step.status)}</StepIcon>
            {step.label}
          </Step>
        ))}
      </StepsList>
    </ProgressContainer>
  );
}
