'use client';

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
        {/* IF Node Name as Subtitle */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: 'text.secondary',
            fontStyle: 'italic',
            mt: 0.3,
            fontSize: '0.6rem'
          }}
        >
          {processor.ifNodeName}
        </Typography>
      </Box>

      {/* IF Conditions Section */}
      <Box sx={{ mb: 0.8 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.3 }}>
          IF CONDITIONS:
        </Typography>
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
          {processor.conditions.length > 0 ? (
            processor.conditions.map((condition, index) => {
              // Format the operator using our helper function
              const operatorStr = formatOperator(condition.operator);

              // Build the condition display
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
          )}
        </Box>
      </Box>

      {/* Output Section */}
      <Box>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.3 }}>
          OUTPUT:
        </Typography>
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
              <Box key={index} sx={{ mb: index < processor.outputs.length - 1 ? 0.2 : 0 }}>
                <Typography
                  component="div"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.6rem',
                    display: 'flex',
                    gap: 0.3
                  }}
                >
                  <Box component="span" sx={{ color: '#2e7d32', fontWeight: 'bold', flexShrink: 0 }}>
                    {output.name}:
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
                    {output.value}
                  </Box>
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
    </Paper>
  );
}
