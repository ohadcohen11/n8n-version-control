'use client';

import { useState } from 'react';
import { Box, Typography, Chip, Paper, IconButton, TextField, Stack, Select, MenuItem, FormControl } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';

// N8N operator mappings
const OPERATOR_LABELS: { [key: string]: string } = {
  // Common
  exists: 'exists',
  notExists: 'does not exist',
  empty: 'is empty',
  notEmpty: 'is not empty',
  equals: 'is equal to',
  notEquals: 'is not equal to',
  // String
  contains: 'contains',
  notContains: 'does not contain',
  startsWith: 'starts with',
  notStartsWith: 'does not start with',
  endsWith: 'ends with',
  notEndsWith: 'does not end with',
  regex: 'matches regex',
  notRegex: 'does not match regex',
  // Number
  gt: 'is greater than',
  lt: 'is less than',
  gte: 'is greater than or equal to',
  lte: 'is less than or equal to',
  // DateTime
  after: 'is after',
  before: 'is before',
  afterOrEquals: 'is after or equal to',
  beforeOrEquals: 'is before or equal to',
  // Boolean
  true: 'is true',
  false: 'is false',
};

// Operators by type
const OPERATORS_BY_TYPE: { [key: string]: string[] } = {
  string: ['exists', 'notExists', 'empty', 'notEmpty', 'equals', 'notEquals', 'contains', 'notContains', 'startsWith', 'notStartsWith', 'endsWith', 'notEndsWith', 'regex', 'notRegex'],
  number: ['exists', 'notExists', 'empty', 'notEmpty', 'equals', 'notEquals', 'gt', 'gte', 'lt', 'lte'],
  dateTime: ['exists', 'notExists', 'empty', 'notEmpty', 'equals', 'notEquals', 'after', 'before', 'afterOrEquals', 'beforeOrEquals'],
  boolean: ['exists', 'notExists', 'empty', 'notEmpty', 'true', 'false', 'equals', 'notEquals'],
};

// Operations that don't need a right value
const SINGLE_VALUE_OPERATIONS = ['exists', 'notExists', 'empty', 'notEmpty', 'true', 'false'];

// Helper function to strip n8n expression syntax for display
const stripExpression = (value: string): string => {
  // Handle ={{ ... }} expressions
  if (value.startsWith('={{')) {
    // If it's a pure expression (ends with }}), strip both start and end
    if (value.endsWith('}}') && value.lastIndexOf('}}') === value.length - 2) {
      return value.slice(3, -2).trim();
    }
    // If there's text after }}, only strip the start
    return value.slice(3);
  } else if (value.startsWith('=')) {
    return value.slice(1); // Remove = from start only
  }
  return value;
};

// Helper function to add n8n expression syntax back when saving
const addExpression = (value: string, originalValue: string): string => {
  // If value is empty, return as is
  if (!value.trim()) return value;

  // Check what prefix the original value had
  const hadCurlyBraces = originalValue.startsWith('={{');
  const hadEquals = originalValue.startsWith('=');

  // If user already added their own expression syntax, keep it
  if (value.startsWith('={{') || value.startsWith('=')) {
    return value;
  }

  // Add back the same syntax that was removed
  if (hadCurlyBraces) {
    // Check if original was a pure expression (ended with }})
    const wasPureExpression = originalValue.endsWith('}}') && originalValue.lastIndexOf('}}') === originalValue.length - 2;

    if (wasPureExpression) {
      // Add both opening and closing
      return `={{ ${value} }}`;
    } else {
      // Only add opening (value already has }} and text after)
      return `={{${value}`;
    }
  } else if (hadEquals) {
    return `=${value}`;
  }

  // Otherwise return as is
  return value;
};

interface ProcessorCondition {
  field: string;
  operator: string | { type?: string; operation?: string; singleValue?: boolean };
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

interface ProcessorCubeProps {
  processor: Processor;
  workflowId: string;
  onUpdate?: () => void;
}

// Processor type colors
const PROCESSOR_COLORS: { [key: string]: string } = {
  'lead': '#4CAF50',          // Green
  'sale': '#2196F3',          // Blue
  'deposit': '#FFC107',       // Amber/Gold
  'canceled': '#F44336',      // Red
  'canceled-lead': '#FF9800', // Orange
  'canceled-sale': '#E91E63', // Pink
  'install': '#9C27B0',       // Purple
  'rev-share': '#00BCD4',     // Cyan
  'unknown': '#757575'        // Grey
};

// Format operator for display
const formatOperator = (operator: string | { type?: string; operation?: string }): string => {
  if (typeof operator === 'string') {
    return operator;
  }

  if (!operator || !operator.operation) {
    return '?';
  }

  // Map operation codes to readable symbols
  const operatorMap: { [key: string]: string } = {
    'gt': '>',
    'gte': '>=',
    'lt': '<',
    'lte': '<=',
    'equals': '==',
    'notEquals': '!=',
    'contains': 'contains',
    'notContains': 'not contains',
    'startsWith': 'starts with',
    'endsWith': 'ends with',
    'isEmpty': 'is empty',
    'notEmpty': 'is not empty',
    'regex': 'matches regex',
    'notRegex': 'not matches regex'
  };

  return operatorMap[operator.operation] || operator.operation;
};

export default function ProcessorCube({ processor, workflowId, onUpdate }: ProcessorCubeProps) {
  const processorColor = PROCESSOR_COLORS[processor.type] || PROCESSOR_COLORS['unknown'];
  const [editingOutputIndex, setEditingOutputIndex] = useState<number | null>(null);
  const [editingOutputValue, setEditingOutputValue] = useState('');
  const [editAllMode, setEditAllMode] = useState(false);
  const [allOutputValues, setAllOutputValues] = useState<{ [key: string]: string }>({});
  const [editingIfNodeName, setEditingIfNodeName] = useState(false);
  const [ifNodeNameValue, setIfNodeNameValue] = useState(processor.ifNodeName);
  const [editingSetNodeName, setEditingSetNodeName] = useState(false);
  const [setNodeNameValue, setSetNodeNameValue] = useState(processor.setNodeName);
  const [editingConditions, setEditingConditions] = useState(false);
  const [conditionsValues, setConditionsValues] = useState<Array<{
    field: string;
    operator: { type: string; operation: string; singleValue?: boolean };
    value: string;
  }>>([]);
  const [saving, setSaving] = useState(false);

  const handleEditAll = () => {
    // Initialize all values with stripped expressions
    const initialValues: { [key: string]: string } = {};
    processor.outputs.forEach((output) => {
      initialValues[output.name] = stripExpression(output.value);
    });
    setAllOutputValues(initialValues);
    setEditAllMode(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Prepare all updates with proper expression syntax
      const updates = processor.outputs.map((output) => ({
        name: output.name,
        value: addExpression(allOutputValues[output.name], output.value),
      }));

      const response = await fetch('/api/update-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          nodeId: processor.setNodeName,
          field: 'outputAll',
          value: updates,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update workflow');
      }

      setEditAllMode(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating outputs:', error);
      alert('Failed to update outputs');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAll = () => {
    setEditAllMode(false);
    setAllOutputValues({});
  };

  const handleEditOutput = (index: number, currentValue: string) => {
    setEditingOutputIndex(index);
    setEditingOutputValue(stripExpression(currentValue));
  };

  const handleSaveOutput = async (outputName: string, originalValue: string) => {
    setSaving(true);
    try {
      const valueWithExpression = addExpression(editingOutputValue, originalValue);

      const response = await fetch('/api/update-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          nodeId: processor.setNodeName,
          field: 'output',
          value: {
            name: outputName,
            value: valueWithExpression,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update workflow');
      }

      setEditingOutputIndex(null);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating output:', error);
      alert('Failed to update output');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingOutputIndex(null);
    setEditingOutputValue('');
  };

  const handleSaveIfNodeName = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/update-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          nodeId: processor.ifNodeName, // Old name
          field: 'nodeName',
          value: ifNodeNameValue, // New name
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update IF node name');
      }

      setEditingIfNodeName(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating IF node name:', error);
      alert('Failed to update IF node name');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSetNodeName = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/update-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          nodeId: processor.setNodeName, // Old name
          field: 'nodeName',
          value: setNodeNameValue, // New name
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update SET node name');
      }

      setEditingSetNodeName(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating SET node name:', error);
      alert('Failed to update SET node name');
    } finally {
      setSaving(false);
    }
  };

  const handleEditConditions = () => {
    // Initialize conditions with current values
    const initialConditions = processor.conditions.map((condition) => ({
      field: condition.field,
      operator: typeof condition.operator === 'string'
        ? { type: 'string', operation: condition.operator, singleValue: SINGLE_VALUE_OPERATIONS.includes(condition.operator) ? true : undefined }
        : {
            type: condition.operator.type || 'string',
            operation: condition.operator.operation || 'equals',
            singleValue: condition.operator.singleValue
          },
      value: condition.value,
    }));
    setConditionsValues(initialConditions);
    setEditingConditions(true);
  };

  const handleSaveConditions = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/update-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          nodeId: processor.ifNodeName,
          field: 'conditions',
          value: conditionsValues,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update conditions');
      }

      setEditingConditions(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating conditions:', error);
      alert('Failed to update conditions');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelConditionsEdit = () => {
    setEditingConditions(false);
    setConditionsValues([]);
  };

  const updateCondition = (index: number, updates: Partial<typeof conditionsValues[0]>) => {
    const newConditions = [...conditionsValues];
    newConditions[index] = { ...newConditions[index], ...updates };

    // If operator changed, check if it needs singleValue flag
    if (updates.operator) {
      const isSingleValue = SINGLE_VALUE_OPERATIONS.includes(updates.operator.operation);
      newConditions[index].operator.singleValue = isSingleValue ? true : undefined;
    }

    setConditionsValues(newConditions);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 1,
        borderRadius: 1,
        border: `1px solid ${processorColor}`,
        width: '100%',
        height: 'auto'
      }}
    >
      {/* Type Badge */}
      <Box sx={{ mb: 0.8 }}>
        <Chip
          label={processor.type.toUpperCase()}
          sx={{
            backgroundColor: processorColor,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.65rem',
            width: '100%',
            height: 20
          }}
        />
      </Box>

      {/* IF Conditions Section */}
      <Box sx={{ mb: 0.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary' }}>
              IF CONDITIONS:
            </Typography>
            {editingIfNodeName ? (
              <TextField
                value={ifNodeNameValue}
                onChange={(e) => setIfNodeNameValue(e.target.value)}
                disabled={saving}
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiInputBase-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.6rem',
                    color: 'black',
                    height: 20,
                  },
                }}
              />
            ) : (
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  fontFamily: 'monospace',
                  color: 'text.secondary',
                  fontStyle: 'italic',
                }}
              >
                ({processor.ifNodeName})
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            {!editingIfNodeName ? (
              <IconButton
                size="small"
                onClick={() => setEditingIfNodeName(true)}
                sx={{ p: 0.3 }}
              >
                <EditIcon sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            ) : (
              <Stack direction="row" spacing={0.3}>
                <IconButton
                  size="small"
                  onClick={handleSaveIfNodeName}
                  disabled={saving}
                  sx={{ p: 0.3, color: 'success.main' }}
                >
                  <SaveIcon sx={{ fontSize: '0.8rem' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setIfNodeNameValue(processor.ifNodeName);
                    setEditingIfNodeName(false);
                  }}
                  disabled={saving}
                  sx={{ p: 0.3, color: 'error.main' }}
                >
                  <CloseIcon sx={{ fontSize: '0.8rem' }} />
                </IconButton>
              </Stack>
            )}
            {!editingConditions ? (
              <IconButton
                size="small"
                onClick={handleEditConditions}
                sx={{ p: 0.3 }}
                title="Edit all conditions"
              >
                <EditIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            ) : (
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={handleSaveConditions}
                  disabled={saving}
                  sx={{ p: 0.3, color: 'success.main' }}
                  title="Save all conditions"
                >
                  <SaveIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleCancelConditionsEdit}
                  disabled={saving}
                  sx={{ p: 0.3, color: 'error.main' }}
                  title="Cancel"
                >
                  <CloseIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Stack>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            backgroundColor: 'grey.100',
            p: 0.5,
            borderRadius: 0.5,
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            overflowX: 'auto'
          }}
        >
          {!editingConditions ? (
            // Read-only display
            processor.conditions.length > 0 ? (
              processor.conditions.map((condition, index) => {
                const operatorStr = formatOperator(condition.operator);
                const conditionExpression = condition.field
                  ? `${condition.field} ${operatorStr}${condition.value ? ' ' + condition.value : ''}`
                  : condition.rawExpression || 'Invalid condition';

                return (
                  <Box key={index} sx={{ mb: index < processor.conditions.length - 1 ? 0.3 : 0 }}>
                    <Typography
                      component="div"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.6rem',
                        display: 'flex',
                        gap: 0.3
                      }}
                    >
                      <Box component="span" sx={{ color: '#1976d2', fontWeight: 'bold', flexShrink: 0 }}>
                        if:
                      </Box>
                      <Box
                        component="pre"
                        sx={{
                          margin: 0,
                          color: 'black',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          flex: 1
                        }}
                      >
                        {conditionExpression}
                      </Box>
                    </Typography>
                  </Box>
                );
              })
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No conditions found
              </Typography>
            )
          ) : (
            // Edit mode
            conditionsValues.map((condition, index) => {
              const isSingleValue = SINGLE_VALUE_OPERATIONS.includes(condition.operator.operation);
              const availableOperations = OPERATORS_BY_TYPE[condition.operator.type] || OPERATORS_BY_TYPE.string;

              return (
                <Box key={index} sx={{ mb: index < conditionsValues.length - 1 ? 0.8 : 0, p: 0.5, border: '1px solid', borderColor: 'grey.300', borderRadius: 0.5 }}>
                  {/* Data Type Selector */}
                  <FormControl size="small" fullWidth sx={{ mb: 0.5 }}>
                    <Select
                      value={condition.operator.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const newOperations = OPERATORS_BY_TYPE[newType];
                        updateCondition(index, {
                          operator: {
                            type: newType,
                            operation: newOperations[0],
                            singleValue: SINGLE_VALUE_OPERATIONS.includes(newOperations[0]) ? true : undefined
                          }
                        });
                      }}
                      disabled={saving}
                      sx={{ fontSize: '0.6rem', height: 24, backgroundColor: 'white', color: 'black' }}
                    >
                      <MenuItem value="string" sx={{ fontSize: '0.6rem' }}>String</MenuItem>
                      <MenuItem value="number" sx={{ fontSize: '0.6rem' }}>Number</MenuItem>
                      <MenuItem value="dateTime" sx={{ fontSize: '0.6rem' }}>Date & Time</MenuItem>
                      <MenuItem value="boolean" sx={{ fontSize: '0.6rem' }}>Boolean</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Left Value (Field) */}
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Field"
                    value={condition.field}
                    onChange={(e) => updateCondition(index, { field: e.target.value })}
                    disabled={saving}
                    sx={{
                      mb: 0.5,
                      '& .MuiInputBase-root': {
                        fontSize: '0.6rem',
                        height: 24,
                        backgroundColor: 'white',
                        color: 'black',
                      },
                    }}
                  />

                  {/* Operation Selector */}
                  <FormControl size="small" fullWidth sx={{ mb: isSingleValue ? 0 : 0.5 }}>
                    <Select
                      value={condition.operator.operation}
                      onChange={(e) => updateCondition(index, {
                        operator: {
                          ...condition.operator,
                          operation: e.target.value,
                          singleValue: SINGLE_VALUE_OPERATIONS.includes(e.target.value) ? true : undefined
                        }
                      })}
                      disabled={saving}
                      sx={{ fontSize: '0.6rem', height: 24, backgroundColor: 'white', color: 'black' }}
                    >
                      {availableOperations.map((op) => (
                        <MenuItem key={op} value={op} sx={{ fontSize: '0.6rem' }}>
                          {OPERATOR_LABELS[op]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Right Value (only if not single value operation) */}
                  {!isSingleValue && (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      disabled={saving}
                      sx={{
                        '& .MuiInputBase-root': {
                          fontSize: '0.6rem',
                          height: 24,
                          backgroundColor: 'white',
                          color: 'black',
                        },
                      }}
                    />
                  )}
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* Output Section */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary' }}>
              OUTPUT:
            </Typography>
            {editingSetNodeName ? (
              <TextField
                value={setNodeNameValue}
                onChange={(e) => setSetNodeNameValue(e.target.value)}
                disabled={saving}
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiInputBase-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.6rem',
                    color: 'black',
                    height: 20,
                  },
                }}
              />
            ) : (
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  fontFamily: 'monospace',
                  color: 'text.secondary',
                  fontStyle: 'italic',
                }}
              >
                ({processor.setNodeName})
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            {!editingSetNodeName ? (
              <IconButton
                size="small"
                onClick={() => setEditingSetNodeName(true)}
                sx={{ p: 0.3 }}
              >
                <EditIcon sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            ) : (
              <Stack direction="row" spacing={0.3}>
                <IconButton
                  size="small"
                  onClick={handleSaveSetNodeName}
                  disabled={saving}
                  sx={{ p: 0.3, color: 'success.main' }}
                >
                  <SaveIcon sx={{ fontSize: '0.8rem' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setSetNodeNameValue(processor.setNodeName);
                    setEditingSetNodeName(false);
                  }}
                  disabled={saving}
                  sx={{ p: 0.3, color: 'error.main' }}
                >
                  <CloseIcon sx={{ fontSize: '0.8rem' }} />
                </IconButton>
              </Stack>
            )}
            {!editAllMode ? (
              <IconButton
                size="small"
                onClick={handleEditAll}
                sx={{ p: 0.3 }}
                title="Edit all outputs"
              >
                <EditIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            ) : (
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={handleSaveAll}
                  disabled={saving}
                  sx={{ p: 0.3, color: 'success.main' }}
                  title="Save all changes"
                >
                  <SaveIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleCancelAll}
                  disabled={saving}
                  sx={{ p: 0.3, color: 'error.main' }}
                  title="Cancel all changes"
                >
                  <CloseIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Stack>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            backgroundColor: 'grey.100',
            p: 0.5,
            borderRadius: 0.5,
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            overflowX: 'auto'
          }}
        >
          {processor.outputs.length > 0 ? (
            processor.outputs.map((output, index) => (
              <Box key={index} sx={{ mb: index < processor.outputs.length - 1 ? 0.3 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.3 }}>
                  <Box component="span" sx={{ color: '#2e7d32', fontWeight: 'bold', flexShrink: 0, fontSize: '0.6rem', fontFamily: 'monospace' }}>
                    {output.name}:
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {editAllMode || editingOutputIndex === index ? (
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={editAllMode ? allOutputValues[output.name] : editingOutputValue}
                        onChange={(e) => {
                          if (editAllMode) {
                            setAllOutputValues({
                              ...allOutputValues,
                              [output.name]: e.target.value,
                            });
                          } else {
                            setEditingOutputValue(e.target.value);
                          }
                        }}
                        disabled={saving}
                        size="small"
                        sx={{
                          '& .MuiInputBase-root': {
                            fontFamily: 'monospace',
                            fontSize: '0.6rem',
                            backgroundColor: 'grey.100',
                            color: 'black',
                            p: 0.5,
                          },
                        }}
                      />
                    ) : (
                      <Box
                        component="pre"
                        sx={{
                          margin: 0,
                          color: 'black',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontFamily: 'monospace',
                          fontSize: '0.6rem',
                        }}
                      >
                        {stripExpression(output.value)}
                      </Box>
                    )}
                  </Box>
                  {!editAllMode && (
                    <Box sx={{ flexShrink: 0 }}>
                      {editingOutputIndex === index ? (
                        <Stack direction="row" spacing={0.3}>
                          <IconButton
                            size="small"
                            onClick={() => handleSaveOutput(output.name, output.value)}
                            disabled={saving}
                            sx={{ p: 0.2, color: 'success.main' }}
                          >
                            <SaveIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={handleCancelEdit}
                            disabled={saving}
                            sx={{ p: 0.2, color: 'error.main' }}
                          >
                            <CloseIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        </Stack>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => handleEditOutput(index, output.value)}
                          sx={{ p: 0.2 }}
                        >
                          <EditIcon sx={{ fontSize: '0.8rem' }} />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No outputs found
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
