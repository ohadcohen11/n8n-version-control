'use client';

import React, { useState, useMemo } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  Alert,
  TableSortLabel
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  CloudDownload as FetchIcon,
  Transform as TransformIcon,
  AccountTree as ProcessorIcon
} from '@mui/icons-material';

interface WorkflowAnalysis {
  workflowId: string;
  workflowName: string;
  trigger: string;
  fetcherType: string;
  translationNodesCount: number;
  processorNodesCount: number;
}

interface WorkflowOverviewProps {
  workflows: WorkflowAnalysis[];
  loading?: boolean;
  error?: string | null;
}

type SortColumn = 'trigger' | 'fetcherType' | 'translationNodesCount' | 'processorNodesCount';
type SortDirection = 'asc' | 'desc';

export default function WorkflowOverview({ workflows, loading, error }: WorkflowOverviewProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending when clicking a new column
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort workflows based on current sort column and direction
  const sortedWorkflows = useMemo(() => {
    if (!sortColumn) {
      return workflows;
    }

    const sorted = [...workflows].sort((a, b) => {
      let compareA: string | number = a[sortColumn];
      let compareB: string | number = b[sortColumn];

      // Special handling for trigger (scheduled vs manual)
      if (sortColumn === 'trigger') {
        // Prioritize scheduled triggers over manual
        const aIsManual = compareA === 'Manual trigger';
        const bIsManual = compareB === 'Manual trigger';

        if (aIsManual && !bIsManual) return 1;
        if (!aIsManual && bIsManual) return -1;

        // If both are scheduled or both are manual, sort alphabetically
        compareA = compareA.toString().toLowerCase();
        compareB = compareB.toString().toLowerCase();
      }

      // Handle numeric sorting
      if (sortColumn === 'translationNodesCount' || sortColumn === 'processorNodesCount') {
        return sortDirection === 'asc'
          ? (compareA as number) - (compareB as number)
          : (compareB as number) - (compareA as number);
      }

      // Handle string sorting
      const strA = compareA.toString().toLowerCase();
      const strB = compareB.toString().toLowerCase();

      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [workflows, sortColumn, sortDirection]);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load workflow analysis: {error}
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Loading workflow analysis...
        </Typography>
      </Box>
    );
  }

  if (!workflows || workflows.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No workflows found to analyze.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.dark' }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
                Workflow Name
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
                <TableSortLabel
                  active={sortColumn === 'trigger'}
                  direction={sortColumn === 'trigger' ? sortDirection : 'asc'}
                  onClick={() => handleSort('trigger')}
                  sx={{
                    color: 'primary.contrastText !important',
                    '&:hover': { color: 'primary.contrastText !important' },
                    '& .MuiTableSortLabel-icon': {
                      color: 'primary.contrastText !important',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" />
                    Trigger / Schedule
                  </Box>
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
                <TableSortLabel
                  active={sortColumn === 'fetcherType'}
                  direction={sortColumn === 'fetcherType' ? sortDirection : 'asc'}
                  onClick={() => handleSort('fetcherType')}
                  sx={{
                    color: 'primary.contrastText !important',
                    '&:hover': { color: 'primary.contrastText !important' },
                    '& .MuiTableSortLabel-icon': {
                      color: 'primary.contrastText !important',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FetchIcon fontSize="small" />
                    Fetcher Type
                  </Box>
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
                <TableSortLabel
                  active={sortColumn === 'translationNodesCount'}
                  direction={sortColumn === 'translationNodesCount' ? sortDirection : 'asc'}
                  onClick={() => handleSort('translationNodesCount')}
                  sx={{
                    color: 'primary.contrastText !important',
                    '&:hover': { color: 'primary.contrastText !important' },
                    '& .MuiTableSortLabel-icon': {
                      color: 'primary.contrastText !important',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <TransformIcon fontSize="small" />
                    Translation Nodes
                  </Box>
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
                <TableSortLabel
                  active={sortColumn === 'processorNodesCount'}
                  direction={sortColumn === 'processorNodesCount' ? sortDirection : 'asc'}
                  onClick={() => handleSort('processorNodesCount')}
                  sx={{
                    color: 'primary.contrastText !important',
                    '&:hover': { color: 'primary.contrastText !important' },
                    '& .MuiTableSortLabel-icon': {
                      color: 'primary.contrastText !important',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <ProcessorIcon fontSize="small" />
                    Processors
                  </Box>
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedWorkflows.map((workflow) => (
              <TableRow
                key={workflow.workflowId}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {workflow.workflowName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {workflow.trigger === 'Manual trigger' ? (
                      <Chip
                        label={workflow.trigger}
                        size="small"
                        color="default"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'success.main' }}>
                        {workflow.trigger}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {workflow.fetcherType === 'None' ? (
                    <Chip
                      label="None"
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      label={workflow.fetcherType}
                      size="small"
                      color="primary"
                      variant="filled"
                    />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={workflow.translationNodesCount}
                    size="small"
                    color={workflow.translationNodesCount > 0 ? 'secondary' : 'default'}
                    variant={workflow.translationNodesCount > 0 ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={workflow.processorNodesCount}
                    size="small"
                    color={workflow.processorNodesCount > 0 ? 'info' : 'default'}
                    variant={workflow.processorNodesCount > 0 ? 'filled' : 'outlined'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Legend:</strong>
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="body2">Trigger: When the workflow runs</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FetchIcon fontSize="small" color="action" />
            <Typography variant="body2">Fetcher: Data source type</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TransformIcon fontSize="small" color="action" />
            <Typography variant="body2">Translation: Data transformation nodes</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ProcessorIcon fontSize="small" color="action" />
            <Typography variant="body2">Processors: IF-SET node pairs</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
