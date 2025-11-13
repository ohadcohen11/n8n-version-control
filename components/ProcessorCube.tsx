'use client';

import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';

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

interface ProcessorCubeProps {
  processor: Processor;
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

export default function ProcessorCube({ processor }: ProcessorCubeProps) {
  const processorColor = PROCESSOR_COLORS[processor.type] || PROCESSOR_COLORS['unknown'];

  // Debug logging
  console.log('ProcessorCube rendering:', {
    type: processor.type,
    conditionsLength: processor.conditions?.length || 0,
    outputsLength: processor.outputs?.length || 0,
    firstCondition: processor.conditions?.[0],
    firstOutput: processor.outputs?.[0]
  });

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `2px solid ${processorColor}`,
        minWidth: 280,
        maxWidth: 400,
        height: 'auto'
      }}
    >
      {/* Type Badge */}
      <Box sx={{ mb: 2 }}>
        <Chip
          label={processor.type.toUpperCase()}
          sx={{
            backgroundColor: processorColor,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            width: '100%'
          }}
        />
      </Box>

      {/* IF Conditions Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
          IF CONDITIONS:
        </Typography>
        <Box
          sx={{
            backgroundColor: 'grey.100',
            p: 1.5,
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            overflowX: 'auto'
          }}
        >
          {processor.conditions.length > 0 ? (
            processor.conditions.map((condition, index) => {
              // Format the operator using our helper function
              const operatorStr = formatOperator(condition.operator);

              // Build the condition display
              const conditionText = condition.field
                ? `if ${condition.field} ${operatorStr}${condition.value ? ' ' + condition.value : ''}`
                : condition.rawExpression || 'Invalid condition';

              return (
                <Box key={index} sx={{ mb: index < processor.conditions.length - 1 ? 1 : 0 }}>
                  <Typography
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: 'black'
                    }}
                  >
                    {conditionText}
                  </Typography>
                </Box>
              );
            })
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No conditions found
            </Typography>
          )}
        </Box>
      </Box>

      {/* Output Section */}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
          OUTPUT:
        </Typography>
        <Box
          sx={{
            backgroundColor: 'grey.100',
            p: 1.5,
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            overflowX: 'auto'
          }}
        >
          {processor.outputs.length > 0 ? (
            processor.outputs.map((output, index) => (
              <Box key={index} sx={{ mb: index < processor.outputs.length - 1 ? 0.5 : 0 }}>
                <Typography
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'black'
                  }}
                >
                  {output.name} = {output.value}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No outputs found
            </Typography>
          )}
        </Box>
      </Box>

      {/* Debug Info (can be removed in production) */}
      <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'grey.300' }}>
        <Typography variant="caption" color="text.secondary">
          IF: {processor.ifNodeName} → SET: {processor.setNodeName}
        </Typography>
      </Box>
    </Paper>
  );
}
