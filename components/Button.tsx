'use client';

import styled from 'styled-components';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

export const Button = styled.button<ButtonProps>`
  padding: ${(props) => {
    switch (props.size) {
      case 'small':
        return '0.5rem 1rem';
      case 'large':
        return '0.875rem 1.75rem';
      default:
        return '0.625rem 1.25rem';
    }
  }};
  font-size: ${(props) => {
    switch (props.size) {
      case 'small':
        return '0.875rem';
      case 'large':
        return '1.125rem';
      default:
        return '1rem';
    }
  }};
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: ${(props) => {
    switch (props.variant) {
      case 'secondary':
        return 'var(--bg-tertiary)';
      case 'danger':
        return 'var(--danger)';
      default:
        return 'var(--primary)';
    }
  }};
  color: var(--text-primary);
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--shadow);
    background: ${(props) => {
      switch (props.variant) {
        case 'secondary':
          return 'var(--text-muted)';
        case 'danger':
          return '#dc2626';
        default:
          return 'var(--primary-dark)';
      }
    }};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;
