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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { keyframes } from '@mui/material/styles';
import Layout from '../components/Layout';
import DashboardStats from '../components/DashboardStats';
import DiffViewer from '../components/DiffViewer';
import CommitsView from '../components/CommitsView';
import ProgressBar from '../components/ProgressBar';
import WorkflowOverview from '../components/WorkflowOverview';

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

interface ProcessorCondition {
  field: string;
  operator: string | { type?: string; operation?: string };
  value: string;
  rawExpression?: string;
}

interface ProcessorOutput {
  name: string;
  value: string;
}

interface Processor {
  id: string;
  type: string;
  ifNodeName: string;
  setNodeName: string;
  conditions: ProcessorCondition[];
  outputs: ProcessorOutput[];
}

interface FetcherNode {
  id: string;
  name: string;
  type: string;
  // HTTP fields
  url?: string;
  method?: string;
  queryParameters?: { name: string; value: string }[];
  headers?: { name: string; value: string }[];
  body?: any;
  authentication?: string;
  // Gmail fields
  operation?: string;
  searchQuery?: string;
  receivedAfter?: string;
  downloadAttachments?: boolean;
}

interface TriggerNode {
  id: string;
  name: string;
  type: string;
  triggerType: 'schedule' | 'manual' | 'webhook' | 'email';
  cronExpression?: string;
  humanReadable?: string;
  scheduleMode?: string;
  scheduleDetails?: string;
}

interface WorkflowAnalysis {
  workflowId: string;
  workflowName: string;
  trigger: string;
  fetcherType: string;
  translationNodesCount: number;
  processorNodesCount: number;
  processors: Processor[];
  fetcher?: FetcherNode;
  triggerNode?: TriggerNode;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'overview' | 'commits' | 'workflow-overview'>('workflow-overview');
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [workflowAnalysis, setWorkflowAnalysis] = useState<WorkflowAnalysis[]>([]);

  // Track loading state per tab
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingWorkflowAnalysis, setLoadingWorkflowAnalysis] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);

  // Track which tabs have been loaded
  const [overviewLoaded, setOverviewLoaded] = useState(false);
  const [workflowAnalysisLoaded, setWorkflowAnalysisLoaded] = useState(false);
  const [commitsLoaded, setCommitsLoaded] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<
    Array<{ label: string; status: 'pending' | 'loading' | 'complete' }>
  >([
    { label: 'Fetching n8n workflows', status: 'pending' },
    { label: 'Fetching GitHub files', status: 'pending' },
    { label: 'Comparing workflows', status: 'pending' },
  ]);
  const [currentStep, setCurrentStep] = useState(0);

  const updateStep = (index: number, status: 'pending' | 'loading' | 'complete') => {
    setLoadingSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  // Fetch Version Control data
  const fetchOverviewData = async () => {
    if (overviewLoaded) return; // Don't refetch if already loaded

    try {
      setError(null);
      setLoadingOverview(true);

      // Reset steps for overview
      setLoadingSteps([
        { label: 'Fetching n8n workflows', status: 'pending' },
        { label: 'Fetching GitHub files', status: 'pending' },
        { label: 'Comparing workflows', status: 'pending' },
      ]);
      setCurrentStep(0);

      updateStep(0, 'loading');
      setCurrentStep(0.5);

      await new Promise((resolve) => setTimeout(resolve, 200));
      updateStep(1, 'loading');
      setCurrentStep(1);

      const compareRes = await fetch('/api/compare').then((res) => res.json());

      updateStep(0, 'complete');
      updateStep(1, 'complete');
      updateStep(2, 'loading');
      setCurrentStep(2);

      await new Promise((resolve) => setTimeout(resolve, 300));
      updateStep(2, 'complete');
      setCurrentStep(3);

      setComparisons(compareRes.comparisons || []);
      setOverviewLoaded(true);

      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      console.error('Error fetching overview data:', err);
      setError('Failed to fetch version control data');
    } finally {
      setLoadingOverview(false);
    }
  };

  // Fetch Workflow Analysis data
  const fetchWorkflowAnalysis = async () => {
    if (workflowAnalysisLoaded) return; // Don't refetch if already loaded

    try {
      setError(null);
      setLoadingWorkflowAnalysis(true);

      const analysisRes = await fetch('/api/analyze-workflows').then((res) => res.json());
      setWorkflowAnalysis(analysisRes || []);
      setWorkflowAnalysisLoaded(true);
    } catch (err) {
      console.error('Error fetching workflow analysis:', err);
      setError('Failed to fetch workflow analysis');
    } finally {
      setLoadingWorkflowAnalysis(false);
    }
  };

  // Fetch Commits data
  const fetchCommitsData = async () => {
    if (commitsLoaded) return; // Don't refetch if already loaded

    try {
      setError(null);
      setLoadingCommits(true);

      const commitsRes = await fetch('/api/github/commits').then((res) => res.json());
      setCommits(commitsRes || []);
      setCommitsLoaded(true);
    } catch (err) {
      console.error('Error fetching commits:', err);
      setError('Failed to fetch commits data');
    } finally {
      setLoadingCommits(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'overview' && !overviewLoaded && !loadingOverview) {
      fetchOverviewData();
    } else if (activeTab === 'workflow-overview' && !workflowAnalysisLoaded && !loadingWorkflowAnalysis) {
      fetchWorkflowAnalysis();
    } else if (activeTab === 'commits' && !commitsLoaded && !loadingCommits) {
      fetchCommitsData();
    }
  }, [activeTab]);

  const handleRefresh = () => {
    // Reset the loaded flag for current tab to force refresh
    if (activeTab === 'overview') {
      setOverviewLoaded(false);
      fetchOverviewData();
    } else if (activeTab === 'workflow-overview') {
      setWorkflowAnalysisLoaded(false);
      fetchWorkflowAnalysis();
    } else if (activeTab === 'commits') {
      setCommitsLoaded(false);
      fetchCommitsData();
    }
  };

  const stats = {
    totalWorkflows: comparisons.length,
    synced: comparisons.filter((c) => c.status === 'synced').length,
    modified: comparisons.filter((c) => c.status === 'modified').length,
    onlyInN8n: comparisons.filter((c) => c.status === 'only_in_n8n').length,
    onlyInGitHub: comparisons.filter((c) => c.status === 'only_in_github').length,
  };

  // Determine if current tab is loading
  const isCurrentTabLoading =
    (activeTab === 'overview' && loadingOverview) ||
    (activeTab === 'workflow-overview' && loadingWorkflowAnalysis) ||
    (activeTab === 'commits' && loadingCommits);

  return (
    <Layout>
      {loadingOverview && activeTab === 'overview' && (
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
                  animation: isCurrentTabLoading ? `${spin} 1s linear infinite` : 'none',
                }}
              />
            }
            onClick={handleRefresh}
            disabled={isCurrentTabLoading}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" variant="filled">
            {error}
          </Alert>
        )}

        {overviewLoaded && <DashboardStats {...stats} />}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ minHeight: 48 }}
          >
            <Tab label="Workflow Changes" value="overview" />
            <Tab label="Workflow Overview" value="workflow-overview" />
            <Tab label="Recent Commits" value="commits" />
          </Tabs>
        </Box>

        {activeTab === 'overview' && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Git Changes
              </Typography>
              {loadingOverview ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                  <CircularProgress size={60} />
                </Box>
              ) : (
                <DiffViewer comparisons={comparisons} onSync={handleRefresh} />
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'workflow-overview' && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Workflow Analysis
              </Typography>
              {loadingWorkflowAnalysis ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                  <CircularProgress size={60} />
                </Box>
              ) : (
                <WorkflowOverview
                  workflows={workflowAnalysis}
                  loading={loadingWorkflowAnalysis}
                  error={error}
                  onUpdate={handleRefresh}
                />
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'commits' && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Recent Commits
              </Typography>
              {loadingCommits ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                  <CircularProgress size={60} />
                </Box>
              ) : (
                <CommitsView commits={commits} />
              )}
            </CardContent>
          </Card>
        )}
      </Stack>
    </Layout>
  );
}
