'use client';

import styled from 'styled-components';
import { Card } from './Card';

const CommitsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CommitItem = styled(Card)`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const CommitAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
`;

const CommitContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CommitMessage = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.375rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CommitMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-muted);
  flex-wrap: wrap;
`;

const CommitAuthor = styled.span`
  color: var(--text-secondary);
`;

const CommitSha = styled.code`
  padding: 0.125rem 0.375rem;
  background: var(--bg-primary);
  border-radius: 4px;
  font-size: 0.75rem;
`;

const CommitDate = styled.span``;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
`;

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author?: {
    login: string;
    avatar_url: string;
  };
}

interface CommitsViewProps {
  commits: Commit[];
}

export default function CommitsView({ commits }: CommitsViewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (commits.length === 0) {
    return (
      <EmptyState>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
        <div>No commits found</div>
      </EmptyState>
    );
  }

  return (
    <CommitsList>
      {commits.map((commit) => (
        <CommitItem key={commit.sha}>
          <CommitAvatar>
            {getInitials(commit.commit.author.name)}
          </CommitAvatar>
          <CommitContent>
            <CommitMessage>{commit.commit.message.split('\n')[0]}</CommitMessage>
            <CommitMeta>
              <CommitAuthor>
                {commit.author?.login || commit.commit.author.name}
              </CommitAuthor>
              <CommitSha>{commit.sha.slice(0, 7)}</CommitSha>
              <CommitDate>{formatDate(commit.commit.author.date)}</CommitDate>
            </CommitMeta>
          </CommitContent>
        </CommitItem>
      ))}
    </CommitsList>
  );
}
