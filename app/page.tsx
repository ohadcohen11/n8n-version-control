'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { keyframes } from '@mui/material/styles';
import Layout from '../components/Layout';
import DashboardStats from '../components/DashboardStats';
import DiffViewer from '../components/DiffViewer';
import CommitsView from '../components/CommitsView';
import ProgressBar from '../components/ProgressBar';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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
  const [loadingSteps, setLoadingSteps] = useState<
    Array<{ label: string; status: 'pending' | 'loading' | 'complete' }>
  >([
    { label: 'Fetching n8n workflows', status: 'pending' },
    { label: 'Fetching GitHub files', status: 'pending' },
    { label: 'Comparing workflows', status: 'pending' },
    { label: 'Fetching commits', status: 'pending' },
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
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Dashboard
          </Typography>
          <Button
            variant="outlined"
            startIcon={
              <RefreshIcon
                sx={{
                  animation: refreshing ? `${spin} 1s linear infinite` : 'none',
                }}
              />
            }
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" variant="filled">
            {error}
          </Alert>
        )}

        {loading && !refreshing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <>
            <DashboardStats {...stats} />

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ minHeight: 48 }}
              >
                <Tab label="Workflow Changes" value="overview" />
                <Tab label="Recent Commits" value="commits" />
              </Tabs>
            </Box>

            {activeTab === 'overview' ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Git Changes
                  </Typography>
                  <DiffViewer comparisons={comparisons} onSync={handleRefresh} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Recent Commits
                  </Typography>
                  <CommitsView commits={commits} />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Stack>
    </Layout>
  );
}
