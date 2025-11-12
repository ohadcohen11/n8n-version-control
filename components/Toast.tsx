'use client';

import styled, { keyframes } from 'styled-components';
import { useEffect, useState, useCallback } from 'react';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div<{ type: 'success' | 'error' | 'info'; $isClosing: boolean }>`
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  background: ${(props) => {
    switch (props.type) {
      case 'success':
        return 'var(--secondary)';
      case 'error':
        return 'var(--danger)';
      default:
        return 'var(--primary)';
    }
  }};
  color: var(--text-primary);
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 300px;
  max-width: 500px;
  z-index: 1000;
  animation: ${(props) => (props.$isClosing ? slideOut : slideIn)} 0.3s ease;
`;

const ToastIcon = styled.div`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const ToastContent = styled.div`
  flex: 1;
`;

const ToastTitle = styled.div`
  font-weight: 600;
  font-size: 0.9375rem;
  margin-bottom: 0.25rem;
`;

const ToastMessage = styled.div`
  font-size: 0.8125rem;
  opacity: 0.9;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

interface ToastProps {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ type, title, message, onClose, duration = 4000 }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  return (
    <ToastContainer type={type} $isClosing={isClosing}>
      <ToastIcon>{getIcon()}</ToastIcon>
      <ToastContent>
        <ToastTitle>{title}</ToastTitle>
        {message && <ToastMessage>{message}</ToastMessage>}
      </ToastContent>
      <CloseButton onClick={handleClose}>×</CloseButton>
    </ToastContainer>
  );
}
