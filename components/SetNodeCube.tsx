'use client';

import { useState } from 'react';
import { Box, Typography, TextField, IconButton, Chip, Select, MenuItem, FormControl, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  TextFields as TextIcon
} from '@mui/icons-material';

interface Assignment {
  id: string;
  name: string;
  type: string;
  value: string;
}

interface SetNode {
  id: string;
  name: string;
  type: string;
  assignments: Assignment[];
}

interface SetNodeCubeProps {
  setNode: SetNode;
  workflowId: string;
  onUpdate?: () => void;
}

const VARIABLE_TYPES = [
  { value: 'string', label: 'String', color: '#3b82f6' },
  { value: 'number', label: 'Number', color: '#10b981' },
  { value: 'boolean', label: 'Boolean', color: '#f59e0b' },
  { value: 'array', label: 'Array', color: '#ec4899' },
  { value: 'object', label: 'Object', color: '#8b5cf6' },
];

export default function SetNodeCube({ setNode, workflowId, onUpdate }: SetNodeCubeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAssignments, setEditedAssignments] = useState<Assignment[]>(setNode.assignments);
  const [isSaving, setIsSaving] = useState(false);

  // Track which variables are expressions (start with ={{)
  const [isExpression, setIsExpression] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    setNode.assignments.forEach(assignment => {
      initial[assignment.id] = assignment.value.trim().startsWith('={{');
    });
    return initial;
  });

  const nodeColor = '#8b5cf6'; // purple for SET nodes

  const handleEdit = () => {
    setEditedAssignments([...setNode.assignments]);
    // Re-initialize isExpression state
    const newIsExpression: Record<string, boolean> = {};
    setNode.assignments.forEach(assignment => {
      newIsExpression[assignment.id] = assignment.value.trim().startsWith('={{');
    });
    setIsExpression(newIsExpression);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedAssignments([...setNode.assignments]);
    setIsEditing(false);
  };

  const handleAssignmentChange = (index: number, field: 'name' | 'value' | 'type', value: string) => {
    const newAssignments = [...editedAssignments];
    newAssignments[index] = {
      ...newAssignments[index],
      [field]: value
    };
    setEditedAssignments(newAssignments);
  };

  const handleExpressionToggle = (assignmentId: string, isExpr: boolean) => {
    setIsExpression(prev => ({ ...prev, [assignmentId]: isExpr }));

    // Update the value format
    const index = editedAssignments.findIndex(a => a.id === assignmentId);
    if (index !== -1) {
      const currentValue = editedAssignments[index].value;
      let newValue = currentValue;

      if (isExpr) {
        // Convert to expression format
        if (!currentValue.trim().startsWith('={{')) {
          newValue = `={{ ${currentValue} }}`;
        }
      } else {
        // Convert to normal value format
        if (currentValue.trim().startsWith('={{')) {
          newValue = currentValue.replace(/^=\{\{\s*/, '').replace(/\s*\}\}$/, '');
        }
      }

      handleAssignmentChange(index, 'value', newValue);
    }
  };

  const handleAddVariable = () => {
    const newId = `var_${Date.now()}`;
    const newAssignment: Assignment = {
      id: newId,
      name: 'newVariable',
      type: 'string',
      value: ''
    };
    setEditedAssignments([...editedAssignments, newAssignment]);
    setIsExpression(prev => ({ ...prev, [newId]: false }));
  };

  const handleRemoveVariable = (index: number) => {
    const assignmentId = editedAssignments[index].id;
    const newAssignments = editedAssignments.filter((_, i) => i !== index);
    setEditedAssignments(newAssignments);

    // Remove from isExpression map
    const newIsExpression = { ...isExpression };
    delete newIsExpression[assignmentId];
    setIsExpression(newIsExpression);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Get the full workflow to update it properly
      const response = await fetch('/api/update-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          nodeId: setNode.id,
          field: 'setNodeAssignments',
          value: editedAssignments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update SET node');
      }

      setIsEditing(false);

      // Call onUpdate callback to refresh the data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating SET node:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeColor = (type: string) => {
    const typeObj = VARIABLE_TYPES.find(t => t.value === type.toLowerCase());
    return typeObj?.color || '#6b7280';
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
        border: '2px solid rgba(139, 92, 246, 0.4)',
        width: '100%',
        height: 'auto',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          border: '2px solid rgba(139, 92, 246, 0.8)',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          transform: 'translateY(-2px)',
        }
      }}
    >
      {/* Title Badge */}
      <Box sx={{ mb: 1.5 }}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${nodeColor} 0%, ${nodeColor}CC 100%)`,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            textAlign: 'center',
            py: 0.75,
            px: 1.5,
            borderRadius: 1.5,
            letterSpacing: '0.5px',
            boxShadow: `0 2px 8px ${nodeColor}50`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, justifyContent: 'center' }}>
            <SettingsIcon sx={{ fontSize: '1rem' }} />
            SET NODE
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
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            fontStyle: 'italic',
            fontSize: '0.7rem',
            mt: 0.5,
            textAlign: 'center'
          }}
        >
          {setNode.name}
        </Typography>
      </Box>

      {/* Assignments */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary' }}>
            VARIABLES ({(isEditing ? editedAssignments : setNode.assignments).length}):
          </Typography>
          {isEditing && (
            <Tooltip title="Add Variable">
              <IconButton
                size="small"
                onClick={handleAddVariable}
                sx={{
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  color: nodeColor,
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.3)' }
                }}
              >
                <AddIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {(isEditing ? editedAssignments : setNode.assignments).map((assignment, index) => (
            <Box
              key={assignment.id}
              sx={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                p: 1.5,
                borderRadius: 1,
                position: 'relative',
              }}
            >
              {/* Delete button */}
              {isEditing && (
                <IconButton
                  size="small"
                  onClick={() => handleRemoveVariable(index)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    p: 0.5,
                    '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.3)' }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              )}

              {/* Type Selector (Edit Mode) or Type Badge (Display Mode) */}
              <Box sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center', pr: isEditing ? 4 : 0 }}>
                {isEditing ? (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={assignment.type}
                      onChange={(e) => handleAssignmentChange(index, 'type', e.target.value)}
                      disabled={isSaving}
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: getTypeColor(assignment.type),
                        backgroundColor: `${getTypeColor(assignment.type)}20`,
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                      }}
                    >
                      {VARIABLE_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value} sx={{ fontSize: '0.75rem' }}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    label={assignment.type}
                    size="small"
                    sx={{
                      backgroundColor: `${getTypeColor(assignment.type)}20`,
                      color: getTypeColor(assignment.type),
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                    }}
                  />
                )}

                {/* Expression Toggle (Edit Mode Only) */}
                {isEditing && (
                  <ToggleButtonGroup
                    value={isExpression[assignment.id] ? 'expression' : 'value'}
                    exclusive
                    onChange={(_, newValue) => {
                      if (newValue !== null) {
                        handleExpressionToggle(assignment.id, newValue === 'expression');
                      }
                    }}
                    size="small"
                    sx={{ height: 28 }}
                  >
                    <ToggleButton
                      value="value"
                      sx={{
                        px: 1,
                        py: 0.5,
                        fontSize: '0.65rem',
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(59, 130, 246, 0.3)',
                          color: '#3b82f6',
                        }
                      }}
                    >
                      <TextIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                      Value
                    </ToggleButton>
                    <ToggleButton
                      value="expression"
                      sx={{
                        px: 1,
                        py: 0.5,
                        fontSize: '0.65rem',
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(139, 92, 246, 0.3)',
                          color: '#8b5cf6',
                        }
                      }}
                    >
                      <CodeIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                      Expression
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
              </Box>

              {/* Variable Name */}
              {isEditing ? (
                <TextField
                  fullWidth
                  value={assignment.name}
                  onChange={(e) => handleAssignmentChange(index, 'name', e.target.value)}
                  disabled={isSaving}
                  placeholder="Variable name"
                  sx={{
                    mb: 1,
                    '& .MuiInputBase-root': {
                      backgroundColor: 'rgba(30, 41, 59, 0.8)',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: 'rgba(167, 139, 250, 1)',
                    }
                  }}
                />
              ) : (
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: 'rgba(167, 139, 250, 1)',
                    mb: 0.5
                  }}
                >
                  {assignment.name}
                </Typography>
              )}

              {/* Variable Value */}
              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={isExpression[assignment.id] ? 3 : 2}
                  value={assignment.value}
                  onChange={(e) => handleAssignmentChange(index, 'value', e.target.value)}
                  disabled={isSaving}
                  placeholder={isExpression[assignment.id] ? "={{ expression }}" : "value"}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: 'rgba(30, 41, 59, 0.8)',
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      color: isExpression[assignment.id] ? 'rgba(167, 139, 250, 0.95)' : 'rgba(226, 232, 240, 0.95)',
                    }
                  }}
                />
              ) : (
                <Box
                  sx={{
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    p: 1,
                    borderRadius: 0.5,
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    color: assignment.value.trim().startsWith('={{') ? 'rgba(167, 139, 250, 0.95)' : 'rgba(226, 232, 240, 0.95)',
                    overflowX: 'auto',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {assignment.value}
                </Box>
              )}
            </Box>
          ))}

          {/* Empty state */}
          {editedAssignments.length === 0 && isEditing && (
            <Box
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                borderRadius: 1,
                border: '1px dashed rgba(139, 92, 246, 0.3)',
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1 }}>
                No variables yet
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
                Click the + button to add your first variable
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Action Buttons */}
      {isEditing && (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
          <IconButton
            size="small"
            onClick={handleSave}
            disabled={isSaving}
            sx={{
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              color: nodeColor,
              '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.3)' },
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
