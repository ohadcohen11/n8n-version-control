'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Layout from '../components/Layout';
import DashboardStats from '../components/DashboardStats';
import DiffViewer from '../components/DiffViewer';
import CommitsView from '../components/CommitsView';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressBar from '../components/ProgressBar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid var(--danger);
  border-radius: 8px;
  padding: 1rem;
  color: var(--danger);
  text-align: center;
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: none;
  border: none;
  color: ${(props) => (props.$active ? 'var(--primary)' : 'var(--text-muted)')};
  border-bottom: 2px solid
    ${(props) => (props.$active ? 'var(--primary)' : 'transparent')};
  margin-bottom: -1px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--primary);
  }
`;

const RefreshButton = styled(Button)`
  &:disabled {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

interface Comparison {
  workflowId: string | null;
  workflowName: string;
  filename: string;
  status: 'synced' | 'modified' | 'only_in_n8n' | 'only_in_github';
  diff: string | null;
  inGitHub: boolean;
  inN8n: boolean;
}

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

export default function Home() {
  const [activeTab, setActiveTab] = useState<'overview' | 'commits'>('overview');
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSteps, setLoadingSteps] = useState([
    { label: 'Fetching n8n workflows', status: 'pending' as const },
    { label: 'Fetching GitHub files', status: 'pending' as const },
    { label: 'Comparing workflows', status: 'pending' as const },
    { label: 'Fetching commits', status: 'pending' as const },
  ]);
  const [currentStep, setCurrentStep] = useState(0);

  const updateStep = (index: number, status: 'pending' | 'loading' | 'complete') => {
    setLoadingSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  const fetchData = async () => {
    try {
      setError(null);

      // Reset steps
      setLoadingSteps([
        { label: 'Fetching n8n workflows', status: 'pending' },
        { label: 'Fetching GitHub files', status: 'pending' },
        { label: 'Comparing workflows', status: 'pending' },
        { label: 'Fetching commits', status: 'pending' },
      ]);
      setCurrentStep(0);

      // Step 1: Fetch n8n workflows
      updateStep(0, 'loading');
      setCurrentStep(0.5);

      const comparePromise = fetch('/api/compare');

      // Step 2: Fetch GitHub files (starts in parallel)
      await new Promise((resolve) => setTimeout(resolve, 200));
      updateStep(1, 'loading');
      setCurrentStep(1);

      // Step 3: Wait for comparison to complete
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateStep(0, 'complete');
      setCurrentStep(1.5);

      await new Promise((resolve) => setTimeout(resolve, 200));
      updateStep(1, 'complete');
      updateStep(2, 'loading');
      setCurrentStep(2);

      // Step 4: Fetch commits
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateStep(3, 'loading');
      setCurrentStep(2.5);

      const commitsPromise = fetch('/api/github/commits');

      // Wait for both to complete
      const [compareRes, commitsRes] = await Promise.all([
        comparePromise.then((res) => res.json()),
        commitsPromise.then((res) => res.json()),
      ]);

      // Step 5: Complete comparison
      updateStep(2, 'complete');
      setCurrentStep(3);
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (!compareRes.comparisons && !commitsRes) {
        throw new Error('Failed to fetch data');
      }

      setComparisons(compareRes.comparisons || []);
      setCommits(commitsRes || []);

      // Step 6: Complete commits
      updateStep(3, 'complete');
      setCurrentStep(4);

      // Small delay to show 100% before hiding
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(
        'Failed to fetch data. Please check your API credentials in .env.local'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const stats = {
    totalWorkflows: comparisons.length,
    synced: comparisons.filter((c) => c.status === 'synced').length,
    modified: comparisons.filter((c) => c.status === 'modified').length,
    onlyInN8n: comparisons.filter((c) => c.status === 'only_in_n8n').length,
    onlyInGitHub: comparisons.filter((c) => c.status === 'only_in_github').length,
  };

  return (
    <Layout>
      {(loading || refreshing) && (
        <ProgressBar
          steps={loadingSteps}
          currentStep={currentStep}
          total={loadingSteps.length}
        />
      )}
      <Container>
        <SectionHeader>
          <SectionTitle>Dashboard</SectionTitle>
          <RefreshButton
            onClick={handleRefresh}
            disabled={refreshing}
            size="medium"
          >
            {refreshing ? '⟳' : '↻'} Refresh
          </RefreshButton>
        </SectionHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {loading && !refreshing ? (
          <LoadingSpinner message="Loading dashboard data..." />
        ) : (
          <>
            <DashboardStats {...stats} />

            <Tabs>
              <Tab
                $active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
              >
                Workflow Changes
              </Tab>
              <Tab
                $active={activeTab === 'commits'}
                onClick={() => setActiveTab('commits')}
              >
                Recent Commits
              </Tab>
            </Tabs>

            {activeTab === 'overview' ? (
              <Section>
                <Card>
                  <CardHeader>
                    <CardTitle>Git Changes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DiffViewer comparisons={comparisons} onSync={handleRefresh} />
                  </CardContent>
                </Card>
              </Section>
            ) : (
              <Section>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Commits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CommitsView commits={commits} />
                  </CardContent>
                </Card>
              </Section>
            )}
          </>
        )}
      </Container>
    </Layout>
  );
}
