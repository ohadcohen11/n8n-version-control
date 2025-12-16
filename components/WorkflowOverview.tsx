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
  TableSortLabel,
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Button
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  CloudDownload as FetchIcon,
  Transform as TransformIcon,
  AccountTree as ProcessorIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import ProcessorCube from './ProcessorCube';
import FetcherCube from './FetcherCube';
import ScheduleTriggerCube from './ScheduleTriggerCube';
import SetNodeCube from './SetNodeCube';

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

interface SetNode {
  id: string;
  name: string;
  type: string;
  assignments: Array<{
    id: string;
    name: string;
    type: string;
    value: string;
  }>;
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
  triggerNodes?: TriggerNode[]; // Support multiple trigger nodes
  setNodes?: SetNode[]; // Standalone SET nodes
}

interface WorkflowOverviewProps {
  workflows: WorkflowAnalysis[];
  loading?: boolean;
  error?: string | null;
  onUpdate?: () => void;
}

type SortColumn = 'trigger' | 'fetcherType' | 'translationNodesCount' | 'processorNodesCount';
type SortDirection = 'asc' | 'desc';

export default function WorkflowOverview({ workflows, loading, error, onUpdate }: WorkflowOverviewProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [triggerFilter, setTriggerFilter] = useState<string[]>([]);
  const [fetcherFilter, setFetcherFilter] = useState<string[]>([]);
  const [processorFilter, setProcessorFilter] = useState<'all' | 'with' | 'without'>('all');

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

  const toggleRow = (workflowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workflowId)) {
        newSet.delete(workflowId);
      } else {
        newSet.add(workflowId);
      }
      return newSet;
    });
  };

  const handleTriggerFilter = (event: React.MouseEvent<HTMLElement>, newFilters: string[]) => {
    setTriggerFilter(newFilters);
  };

  const handleFetcherFilter = (event: React.MouseEvent<HTMLElement>, newFilters: string[]) => {
    setFetcherFilter(newFilters);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTriggerFilter([]);
    setFetcherFilter([]);
    setProcessorFilter('all');
  };

  const hasActiveFilters = searchQuery || triggerFilter.length > 0 || fetcherFilter.length > 0 || processorFilter !== 'all';

  // Get unique trigger and fetcher types
  const uniqueTriggerTypes = useMemo(() => {
    const types = new Set<string>();
    workflows.forEach(w => {
      if (w.trigger.includes('Manual')) types.add('Manual');
      else if (w.trigger.includes('Webhook')) types.add('Webhook');
      else if (w.trigger.includes('Email')) types.add('Email');
      else if (w.trigger !== 'No trigger found') types.add('Schedule');
    });
    return Array.from(types).sort();
  }, [workflows]);

  const uniqueFetcherTypes = useMemo(() => {
    const types = new Set<string>();
    workflows.forEach(w => types.add(w.fetcherType));
    return Array.from(types).sort();
  }, [workflows]);

  // Filter and sort workflows
  const filteredAndSortedWorkflows = useMemo(() => {
    // Step 1: Apply filters
    let filtered = workflows.filter(workflow => {
      // Search filter
      if (searchQuery && !workflow.workflowName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Trigger filter
      if (triggerFilter.length > 0) {
        const matchesTrigger = triggerFilter.some(filter => {
          if (filter === 'Manual') return workflow.trigger.includes('Manual');
          if (filter === 'Schedule') return !workflow.trigger.includes('Manual') && !workflow.trigger.includes('Webhook') && !workflow.trigger.includes('Email') && workflow.trigger !== 'No trigger found';
          if (filter === 'Webhook') return workflow.trigger.includes('Webhook');
          if (filter === 'Email') return workflow.trigger.includes('Email');
          return false;
        });
        if (!matchesTrigger) return false;
      }

      // Fetcher filter
      if (fetcherFilter.length > 0 && !fetcherFilter.includes(workflow.fetcherType)) {
        return false;
      }

      // Processor filter
      if (processorFilter === 'with' && workflow.processorNodesCount === 0) return false;
      if (processorFilter === 'without' && workflow.processorNodesCount > 0) return false;

      return true;
    });

    // Step 2: Sort
    if (!sortColumn) {
      return filtered;
    }

    const sorted = [...filtered].sort((a, b) => {
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
  }, [workflows, sortColumn, sortDirection, searchQuery, triggerFilter, fetcherFilter, processorFilter]);

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
      {/* Search and Filter Controls */}
      <Box
        sx={{
          mb: 2,
          p: 2,
          backgroundColor: 'rgba(17, 25, 40, 0.95)',
          borderRadius: 2,
          border: '1px solid rgba(99, 102, 241, 0.2)',
        }}
      >
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search workflows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            mb: 2,
            '& .MuiInputBase-root': {
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              color: 'rgba(226, 232, 240, 0.95)',
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(99, 102, 241, 0.7)' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <ClearIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Filter Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Trigger Type Filter */}
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', mb: 1 }}>
              TRIGGER TYPE:
            </Typography>
            <ToggleButtonGroup
              value={triggerFilter}
              onChange={handleTriggerFilter}
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              {uniqueTriggerTypes.map((type) => (
                <ToggleButton
                  key={type}
                  value={type}
                  sx={{
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(99, 102, 241, 0.3)',
                      color: '#6366f1',
                      '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.4)',
                      }
                    }
                  }}
                >
                  {type}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Fetcher Type Filter */}
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', mb: 1 }}>
              FETCHER TYPE:
            </Typography>
            <ToggleButtonGroup
              value={fetcherFilter}
              onChange={handleFetcherFilter}
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              {uniqueFetcherTypes.map((type) => (
                <ToggleButton
                  key={type}
                  value={type}
                  sx={{
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(99, 102, 241, 0.3)',
                      color: '#6366f1',
                      '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.4)',
                      }
                    }
                  }}
                >
                  {type}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Processor Filter */}
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', mb: 1 }}>
              PROCESSORS:
            </Typography>
            <ToggleButtonGroup
              value={processorFilter}
              exclusive
              onChange={(_, newValue) => {
                if (newValue !== null) {
                  setProcessorFilter(newValue);
                }
              }}
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              <ToggleButton
                value="all"
                sx={{
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(99, 102, 241, 0.3)',
                    color: '#6366f1',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.4)',
                    }
                  }
                }}
              >
                All
              </ToggleButton>
              <ToggleButton
                value="with"
                sx={{
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(99, 102, 241, 0.3)',
                    color: '#6366f1',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.4)',
                    }
                  }
                }}
              >
                With Processors
              </ToggleButton>
              <ToggleButton
                value="without"
                sx={{
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(99, 102, 241, 0.3)',
                    color: '#6366f1',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.4)',
                    }
                  }
                }}
              >
                Without Processors
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                Showing {filteredAndSortedWorkflows.length} of {workflows.length} workflows
              </Typography>
              <Button
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                size="small"
                sx={{
                  color: 'rgba(239, 68, 68, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  }
                }}
              >
                Clear Filters
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <TableContainer
        sx={{
          mt: 2,
          backgroundColor: 'rgba(17, 25, 40, 0.95)',
          borderRadius: 2,
          border: '1px solid rgba(99, 102, 241, 0.2)',
          overflow: 'hidden'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)',
              borderBottom: '2px solid rgba(139, 92, 246, 0.5)'
            }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText', width: 50 }}>
                {/* Expand column */}
              </TableCell>
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
            {filteredAndSortedWorkflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No workflows match your filters
                  </Typography>
                  {hasActiveFilters && (
                    <Button
                      onClick={clearFilters}
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedWorkflows.map((workflow) => {
              const isExpanded = expandedRows.has(workflow.workflowId);
              const hasProcessors = workflow.processors && workflow.processors.length > 0;

              return (
                <React.Fragment key={workflow.workflowId}>
                  {/* Main workflow row */}
                  <TableRow
                    sx={{
                      backgroundColor: 'rgba(30, 41, 59, 0.5)',
                      borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        transform: 'scale(1.01)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                      },
                    }}
                  >
                    <TableCell>
                      {hasProcessors ? (
                        <IconButton
                          size="small"
                          onClick={() => toggleRow(workflow.workflowId)}
                          sx={{ color: 'primary.main' }}
                        >
                          {isExpanded ? <ArrowDownIcon /> : <ArrowRightIcon />}
                        </IconButton>
                      ) : (
                        <Box sx={{ width: 40 }} />
                      )}
                    </TableCell>
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

                  {/* Expandable processor cubes row */}
                  {hasProcessors && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{
                          py: 0,
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          borderTop: '2px solid rgba(139, 92, 246, 0.3)',
                          borderBottom: '2px solid rgba(139, 92, 246, 0.3)',
                        }}
                      >
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box
                            sx={{
                              py: 3,
                              px: 3,
                              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
                              borderRadius: 1
                            }}
                          >
                            {/* Schedule Trigger Section - Support Multiple Triggers */}
                            {workflow.triggerNodes && workflow.triggerNodes.filter(t => t.triggerType === 'schedule').length > 0 && (
                              <Box sx={{ mb: 3 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontSize: '0.95rem',
                                    fontWeight: 'bold',
                                    mb: 1.5,
                                    color: 'rgba(167, 139, 250, 1)',
                                    letterSpacing: '0.5px',
                                    textTransform: 'uppercase'
                                  }}
                                >
                                  Schedules ({workflow.triggerNodes.filter(t => t.triggerType === 'schedule').length})
                                </Typography>
                                <Box
                                  sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                    gap: 2
                                  }}
                                >
                                  {workflow.triggerNodes
                                    .filter(trigger => trigger.triggerType === 'schedule')
                                    .map((trigger) => (
                                      <ScheduleTriggerCube
                                        key={trigger.id}
                                        trigger={trigger}
                                        workflowId={workflow.workflowId}
                                        onUpdate={onUpdate}
                                      />
                                    ))}
                                </Box>
                              </Box>
                            )}

                            {/* Fetcher Section */}
                            {workflow.fetcher && (
                              <Box sx={{ mb: 3 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontSize: '0.95rem',
                                    fontWeight: 'bold',
                                    mb: 1.5,
                                    color: 'rgba(96, 165, 250, 1)',
                                    letterSpacing: '0.5px',
                                    textTransform: 'uppercase'
                                  }}
                                >
                                  Fetcher
                                </Typography>
                                <FetcherCube
                                  fetcher={workflow.fetcher}
                                  workflowId={workflow.workflowId}
                                  onUpdate={onUpdate}
                                />
                              </Box>
                            )}

                            {/* Standalone SET Nodes Section */}
                            {workflow.setNodes && workflow.setNodes.length > 0 && (
                              <Box sx={{ mb: 3 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontSize: '0.95rem',
                                    fontWeight: 'bold',
                                    mb: 1.5,
                                    color: 'rgba(139, 92, 246, 1)',
                                    letterSpacing: '0.5px',
                                    textTransform: 'uppercase'
                                  }}
                                >
                                  Variables ({workflow.setNodes.length})
                                </Typography>
                                <Box
                                  sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                    gap: 2
                                  }}
                                >
                                  {workflow.setNodes.map((setNode) => (
                                    <SetNodeCube
                                      key={setNode.id}
                                      setNode={setNode}
                                      workflowId={workflow.workflowId}
                                      onUpdate={onUpdate}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}

                            {/* Processors Section */}
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontSize: '0.95rem',
                                fontWeight: 'bold',
                                mb: 1.5,
                                color: 'rgba(52, 211, 153, 1)',
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase'
                              }}
                            >
                              Processors ({workflow.processors.length})
                            </Typography>
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 2
                              }}
                            >
                              {workflow.processors.map((processor) => (
                                <ProcessorCube
                                  key={processor.id}
                                  processor={processor}
                                  workflowId={workflow.workflowId}
                                  onUpdate={onUpdate}
                                />
                              ))}
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          mt: 3,
          p: 3,
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
          borderRadius: 2,
          border: '1px solid rgba(99, 102, 241, 0.2)',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(167, 139, 250, 1)',
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            mb: 2
          }}
        >
          Legend
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon fontSize="small" sx={{ color: 'rgba(251, 191, 36, 1)' }} />
            <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.9)' }}>
              Trigger: When the workflow runs
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FetchIcon fontSize="small" sx={{ color: 'rgba(96, 165, 250, 1)' }} />
            <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.9)' }}>
              Fetcher: Data source type
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TransformIcon fontSize="small" sx={{ color: 'rgba(251, 113, 133, 1)' }} />
            <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.9)' }}>
              Translation: Data transformation nodes
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ProcessorIcon fontSize="small" sx={{ color: 'rgba(52, 211, 153, 1)' }} />
            <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.9)' }}>
              Processors: IF-SET node pairs
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
