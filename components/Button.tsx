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
        return '0.4375rem 0.875rem';
      case 'large':
        return '0.75rem 1.5rem';
      default:
        return '0.5625rem 1.125rem';
    }
  }};
  font-size: ${(props) => {
    switch (props.size) {
      case 'small':
        return '0.8125rem';
      case 'large':
        return '1rem';
      default:
        return '0.875rem';
    }
  }};
  font-weight: 500;
  border: none;
  border-radius: 6px;
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
  gap: 0.375rem;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--shadow);
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
