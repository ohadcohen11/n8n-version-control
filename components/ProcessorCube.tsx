'use client';

import { useState } from 'react';
import { Box, Typography, TextField, IconButton, Select, MenuItem, FormControl, Divider } from '@mui/material';
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AccountTree as ProcessorIcon
} from '@mui/icons-material';

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

// N8N operator mappings
const OPERATOR_LABELS: { [key: string]: string } = {
  exists: 'exists',
  notExists: 'does not exist',
  empty: 'is empty',
  notEmpty: 'is not empty',
  equals: 'is equal to',
  notEquals: 'is not equal to',
  contains: 'contains',
  notContains: 'does not contain',
  startsWith: 'starts with',
  notStartsWith: 'does not start with',
  endsWith: 'ends with',
  notEndsWith: 'does not end with',
  regex: 'matches regex',
  notRegex: 'does not match regex',
  gt: 'is greater than',
  lt: 'is less than',
  gte: 'is greater than or equal to',
  lte: 'is less than or equal to',
  after: 'is after',
  before: 'is before',
  afterOrEquals: 'is after or equal to',
  beforeOrEquals: 'is before or equal to',
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

// Helper function to strip n8n expression syntax
const stripExpression = (value: string): string => {
  if (value.startsWith('={{') && value.endsWith('}}')) {
    return value.slice(3, -2).trim();
  } else if (value.startsWith('=')) {
    return value.slice(1);
  }
  return value;
};

// Helper function to add n8n expression syntax back
const addExpression = (value: string, originalValue: string): string => {
  if (!value.trim()) return value;
  if (value.startsWith('={{') || value.startsWith('=')) return value;

  if (originalValue.startsWith('={{')) {
    return `={{ ${value} }}`;
  } else if (originalValue.startsWith('=')) {
    return `=${value}`;
  }
  return value;
};

// Format operator for display
const formatOperator = (operator: string | { type?: string; operation?: string }): string => {
  if (typeof operator === 'string') {
    return OPERATOR_LABELS[operator] || operator;
  }
  if (!operator || !operator.operation) return '?';
  return OPERATOR_LABELS[operator.operation] || operator.operation;
};

export default function ProcessorCube({ processor, workflowId, onUpdate }: ProcessorCubeProps) {
  const processorColor = PROCESSOR_COLORS[processor.type] || PROCESSOR_COLORS['unknown'];
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit state
  const [editedIfNodeName, setEditedIfNodeName] = useState(processor.ifNodeName);
  const [editedSetNodeName, setEditedSetNodeName] = useState(processor.setNodeName);
  const [editedConditions, setEditedConditions] = useState<Array<{
    field: string;
    operator: { type: string; operation: string; singleValue?: boolean };
    value: string;
  }>>([]);
  const [editedOutputs, setEditedOutputs] = useState<{ [key: string]: string }>({});

  const handleEdit = () => {
    setEditedIfNodeName(processor.ifNodeName);
    setEditedSetNodeName(processor.setNodeName);

    // Initialize conditions
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
    setEditedConditions(initialConditions);

    // Initialize outputs
    const initialOutputs: { [key: string]: string } = {};
    processor.outputs.forEach((output) => {
      initialOutputs[output.name] = stripExpression(output.value);
    });
    setEditedOutputs(initialOutputs);

    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedConditions([]);
    setEditedOutputs({});
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // 1. Update IF node name
      if (editedIfNodeName !== processor.ifNodeName) {
        const response = await fetch('/api/update-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId,
            nodeId: processor.ifNodeName,
            field: 'nodeName',
            value: editedIfNodeName,
          }),
        });
        if (!response.ok) throw new Error('Failed to update IF node name');
      }

      // 2. Update SET node name
      if (editedSetNodeName !== processor.setNodeName) {
        const response = await fetch('/api/update-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId,
            nodeId: processor.setNodeName,
            field: 'nodeName',
            value: editedSetNodeName,
          }),
        });
        if (!response.ok) throw new Error('Failed to update SET node name');
      }

      // 3. Update conditions
      const conditionsResponse = await fetch('/api/update-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          nodeId: editedIfNodeName,
          field: 'conditions',
          value: editedConditions,
        }),
      });
      if (!conditionsResponse.ok) throw new Error('Failed to update conditions');

      // 4. Update outputs
      const updates = processor.outputs.map((output) => ({
        name: output.name,
        value: addExpression(editedOutputs[output.name], output.value),
      }));

      const outputsResponse = await fetch('/api/update-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          nodeId: editedSetNodeName,
          field: 'outputAll',
          value: updates,
        }),
      });
      if (!outputsResponse.ok) throw new Error('Failed to update outputs');

      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error saving processor:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateCondition = (index: number, updates: Partial<typeof editedConditions[0]>) => {
    const newConditions = [...editedConditions];
    newConditions[index] = { ...newConditions[index], ...updates };

    if (updates.operator) {
      const isSingleValue = SINGLE_VALUE_OPERATIONS.includes(updates.operator.operation);
      newConditions[index].operator.singleValue = isSingleValue ? true : undefined;
    }

    setEditedConditions(newConditions);
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${processorColor}20 0%, ${processorColor}10 100%)`,
        border: `2px solid ${processorColor}60`,
        width: '100%',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          border: `2px solid ${processorColor}`,
          boxShadow: `0 4px 12px ${processorColor}40`,
          transform: 'translateY(-2px)',
        }
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 1.5 }}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${processorColor} 0%, ${processorColor}CC 100%)`,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            textAlign: 'center',
            py: 0.75,
            px: 1.5,
            borderRadius: 1.5,
            letterSpacing: '0.5px',
            boxShadow: `0 2px 8px ${processorColor}50`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, justifyContent: 'center' }}>
            <ProcessorIcon sx={{ fontSize: '1rem' }} />
            {processor.type.toUpperCase()}
          </Box>
          {!isEditing && (
            <IconButton
              size="small"
              onClick={handleEdit}
              sx={{
                color: 'white',
                p: 0.5,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
              }}
            >
              <EditIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Node Names */}
      {isEditing && (
        <Box sx={{ mb: 1.5, display: 'flex', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.5 }}>
              IF NODE NAME:
            </Typography>
            <TextField
              fullWidth
              value={editedIfNodeName}
              onChange={(e) => setEditedIfNodeName(e.target.value)}
              disabled={isSaving}
              size="small"
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  fontSize: '0.7rem',
                  color: 'rgba(226, 232, 240, 0.95)',
                }
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.5 }}>
              SET NODE NAME:
            </Typography>
            <TextField
              fullWidth
              value={editedSetNodeName}
              onChange={(e) => setEditedSetNodeName(e.target.value)}
              disabled={isSaving}
              size="small"
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  fontSize: '0.7rem',
                  color: 'rgba(226, 232, 240, 0.95)',
                }
              }}
            />
          </Box>
        </Box>
      )}

      {/* IF Conditions Section */}
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary' }}>
            IF CONDITIONS:
          </Typography>
          {!isEditing && (
            <Typography
              sx={{
                fontSize: '0.65rem',
                fontFamily: 'monospace',
                color: 'text.disabled',
                fontStyle: 'italic',
              }}
            >
              ({processor.ifNodeName})
            </Typography>
          )}
        </Box>

        {!isEditing ? (
          <Box
            sx={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: `1px solid ${processorColor}40`,
              p: 1.5,
              borderRadius: 1,
            }}
          >
            {processor.conditions.length > 0 ? (
              processor.conditions.map((condition, index) => (
                <Box key={index} sx={{ mb: index < processor.conditions.length - 1 ? 1 : 0 }}>
                  <Typography
                    component="div"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      display: 'flex',
                      gap: 0.5,
                      alignItems: 'baseline'
                    }}
                  >
                    <Box component="span" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                      IF
                    </Box>
                    <Box component="span" sx={{ color: 'rgba(226, 232, 240, 0.95)' }}>
                      {condition.field}
                    </Box>
                    <Box component="span" sx={{ color: '#ffa726', fontStyle: 'italic' }}>
                      {formatOperator(condition.operator)}
                    </Box>
                    {condition.value && (
                      <Box component="span" sx={{ color: '#81c784' }}>
                        {condition.value}
                      </Box>
                    )}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontStyle: 'italic' }}>
                No conditions
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {editedConditions.map((condition, index) => {
              const isSingleValue = SINGLE_VALUE_OPERATIONS.includes(condition.operator.operation);
              const availableOperations = OPERATORS_BY_TYPE[condition.operator.type] || OPERATORS_BY_TYPE.string;

              return (
                <Box
                  key={index}
                  sx={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${processorColor}40`,
                    p: 1,
                    borderRadius: 1,
                  }}
                >
                  {/* Type Selector */}
                  <FormControl size="small" fullWidth sx={{ mb: 0.8 }}>
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
                      disabled={isSaving}
                      sx={{
                        fontSize: '0.7rem',
                        backgroundColor: 'rgba(30, 41, 59, 0.8)',
                        color: 'rgba(226, 232, 240, 0.95)',
                      }}
                    >
                      <MenuItem value="string" sx={{ fontSize: '0.7rem' }}>String</MenuItem>
                      <MenuItem value="number" sx={{ fontSize: '0.7rem' }}>Number</MenuItem>
                      <MenuItem value="dateTime" sx={{ fontSize: '0.7rem' }}>Date & Time</MenuItem>
                      <MenuItem value="boolean" sx={{ fontSize: '0.7rem' }}>Boolean</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Field */}
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Field"
                    value={condition.field}
                    onChange={(e) => updateCondition(index, { field: e.target.value })}
                    disabled={isSaving}
                    sx={{
                      mb: 0.8,
                      '& .MuiInputBase-root': {
                        fontSize: '0.7rem',
                        backgroundColor: 'rgba(30, 41, 59, 0.8)',
                        color: 'rgba(226, 232, 240, 0.95)',
                      },
                    }}
                  />

                  {/* Operation Selector */}
                  <FormControl size="small" fullWidth sx={{ mb: isSingleValue ? 0 : 0.8 }}>
                    <Select
                      value={condition.operator.operation}
                      onChange={(e) => updateCondition(index, {
                        operator: {
                          ...condition.operator,
                          operation: e.target.value,
                          singleValue: SINGLE_VALUE_OPERATIONS.includes(e.target.value) ? true : undefined
                        }
                      })}
                      disabled={isSaving}
                      sx={{
                        fontSize: '0.7rem',
                        backgroundColor: 'rgba(30, 41, 59, 0.8)',
                        color: 'rgba(226, 232, 240, 0.95)',
                      }}
                    >
                      {availableOperations.map((op) => (
                        <MenuItem key={op} value={op} sx={{ fontSize: '0.7rem' }}>
                          {OPERATOR_LABELS[op]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Value */}
                  {!isSingleValue && (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      disabled={isSaving}
                      sx={{
                        '& .MuiInputBase-root': {
                          fontSize: '0.7rem',
                          backgroundColor: 'rgba(30, 41, 59, 0.8)',
                          color: 'rgba(226, 232, 240, 0.95)',
                        },
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 1.5, borderColor: `${processorColor}40` }} />

      {/* Output Section */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary' }}>
            OUTPUTS:
          </Typography>
          {!isEditing && (
            <Typography
              sx={{
                fontSize: '0.65rem',
                fontFamily: 'monospace',
                color: 'text.disabled',
                fontStyle: 'italic',
              }}
            >
              ({processor.setNodeName})
            </Typography>
          )}
        </Box>

        {!isEditing ? (
          <Box
            sx={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: `1px solid ${processorColor}40`,
              p: 1.5,
              borderRadius: 1,
            }}
          >
            {processor.outputs.length > 0 ? (
              processor.outputs.map((output, index) => (
                <Box key={index} sx={{ mb: index < processor.outputs.length - 1 ? 1 : 0 }}>
                  <Typography
                    component="div"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      display: 'flex',
                      gap: 0.5,
                      alignItems: 'baseline'
                    }}
                  >
                    <Box component="span" sx={{ color: '#81c784', fontWeight: 'bold' }}>
                      {output.name}:
                    </Box>
                    <Box component="span" sx={{ color: 'rgba(226, 232, 240, 0.95)', wordBreak: 'break-all' }}>
                      {stripExpression(output.value)}
                    </Box>
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontStyle: 'italic' }}>
                No outputs
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {processor.outputs.map((output, index) => (
              <Box key={index}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.5 }}>
                  {output.name}:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={editedOutputs[output.name]}
                  onChange={(e) => setEditedOutputs({ ...editedOutputs, [output.name]: e.target.value })}
                  disabled={isSaving}
                  placeholder="Value"
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: 'rgba(30, 41, 59, 0.8)',
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      color: 'rgba(226, 232, 240, 0.95)',
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Action Buttons */}
      {isEditing && (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
          <IconButton
            size="small"
            onClick={handleSave}
            disabled={isSaving}
            sx={{
              backgroundColor: `${processorColor}30`,
              color: processorColor,
              '&:hover': { backgroundColor: `${processorColor}40` },
              '&:disabled': { opacity: 0.5 }
            }}
          >
            <CheckIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleCancel}
            disabled={isSaving}
            sx={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.3)' },
              '&:disabled': { opacity: 0.5 }
            }}
          >
            <CloseIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
