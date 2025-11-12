'use client';

import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { Button } from './Button';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Modal = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  box-shadow: 0 8px 32px var(--shadow);
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ModalIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(99, 102, 241, 0.15);
  border: 2px solid var(--primary);
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
`;

const ModalContent = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9375rem;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9375rem;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

const CharCount = styled.div<{ isOver: boolean }>`
  font-size: 0.75rem;
  color: ${(props) => (props.isOver ? 'var(--danger)' : 'var(--text-muted)')};
  text-align: right;
  margin-top: 0.25rem;
`;

const Hint = styled.div`
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

interface CommitModalProps {
  isOpen: boolean;
  workflowName: string;
  defaultMessage: string;
  onConfirm: (commitMessage: string) => void;
  onCancel: () => void;
}

export default function CommitModal({
  isOpen,
  workflowName,
  defaultMessage,
  onConfirm,
  onCancel,
}: CommitModalProps) {
  const [message, setMessage] = useState(defaultMessage);

  // Reset message when modal opens with new default
  useEffect(() => {
    if (isOpen) {
      setMessage(defaultMessage);
    }
  }, [isOpen, defaultMessage]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (message.trim()) {
      onConfirm(message.trim());
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleConfirm();
    }
  };

  return (
    <Overlay onClick={onCancel}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalIcon>💾</ModalIcon>
          <ModalTitle>Commit to GitHub</ModalTitle>
        </ModalHeader>

        <ModalContent>
          <Label>Workflow</Label>
          <Input
            type="text"
            value={workflowName}
            disabled
            style={{ marginBottom: '1rem', opacity: 0.7, cursor: 'not-allowed' }}
          />

          <Label>Commit Message *</Label>
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Update workflow configuration"
            maxLength={100}
            autoFocus
          />
          <CharCount isOver={message.length > 72}>
            {message.length}/100 characters {message.length > 72 && '(recommended: 72 or less)'}
          </CharCount>
          <Hint>
            💡 Tip: Press <kbd>Cmd/Ctrl + Enter</kbd> to commit quickly
          </Hint>
        </ModalContent>

        <ModalActions>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!message.trim()}
          >
            ↑ Push to GitHub
          </Button>
        </ModalActions>
      </Modal>
    </Overlay>
  );
}
