'use client';

import { useState } from 'react';
import { Box, Typography, Chip, IconButton, TextField, Stack, Select, MenuItem } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';

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
  // Google Sheets fields
  documentId?: string;
  sheetId?: string;
}

interface FetcherCubeProps {
  fetcher: FetcherNode;
  workflowId: string;
  onUpdate?: () => void;
}

export default function FetcherCube({ fetcher, workflowId, onUpdate }: FetcherCubeProps) {
  const [editingSearchQuery, setEditingSearchQuery] = useState(false);
  const [searchQueryValue, setSearchQueryValue] = useState(fetcher.searchQuery || '');
  const [editingDownloadAttachments, setEditingDownloadAttachments] = useState(false);
  const [downloadAttachmentsValue, setDownloadAttachmentsValue] = useState(fetcher.downloadAttachments ?? true);
  const [saving, setSaving] = useState(false);

  const handleSaveSearchQuery = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/update-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          nodeId: fetcher.id,
          field: 'searchQuery',
          value: searchQueryValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update workflow');
      }

      setEditingSearchQuery(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating search query:', error);
      alert('Failed to update search query');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDownloadAttachments = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/update-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          nodeId: fetcher.id,
          field: 'downloadAttachments',
          value: downloadAttachmentsValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update workflow');
      }

      setEditingDownloadAttachments(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating download attachments:', error);
      alert('Failed to update download attachments');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setSearchQueryValue(fetcher.searchQuery || '');
    setEditingSearchQuery(false);
  };

  const handleCancelDownloadAttachmentsEdit = () => {
    setDownloadAttachmentsValue(fetcher.downloadAttachments ?? true);
    setEditingDownloadAttachments(false);
  };
  const isHTTP = fetcher.type === 'n8n-nodes-base.httpRequest';
  const isGmail = fetcher.type === 'n8n-nodes-base.gmail';
  const isGoogleSheets = fetcher.type === 'n8n-nodes-base.googleSheets';

  // Gmail display
  if (isGmail) {
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(234, 67, 53, 0.15) 0%, rgba(234, 67, 53, 0.08) 100%)',
          border: '2px solid rgba(234, 67, 53, 0.4)',
          width: '100%',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            border: '2px solid rgba(234, 67, 53, 0.8)',
            boxShadow: '0 4px 12px rgba(234, 67, 53, 0.3)',
            transform: 'translateY(-2px)',
          }
        }}
      >
        {/* Title */}
        <Box sx={{ mb: 0.8 }}>
          <Chip
            label={`GMAIL ${fetcher.operation?.toUpperCase() || 'GET ALL'}`}
            sx={{
              backgroundColor: '#EA4335',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.65rem',
              height: 20
            }}
          />
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.secondary',
              fontStyle: 'italic',
              fontSize: '0.6rem',
              mt: 0.3
            }}
          >
            {fetcher.name}
          </Typography>
        </Box>

        {/* Search Query */}
        {(fetcher.searchQuery || editingSearchQuery) && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary' }}>
                SEARCH:
              </Typography>
              {!editingSearchQuery ? (
                <IconButton
                  size="small"
                  onClick={() => setEditingSearchQuery(true)}
                  sx={{ p: 0.3 }}
                >
                  <EditIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              ) : (
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={handleSaveSearchQuery}
                    disabled={saving}
                    sx={{ p: 0.3, color: 'success.main' }}
                  >
                    <SaveIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    sx={{ p: 0.3, color: 'error.main' }}
                  >
                    <CloseIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Stack>
              )}
            </Box>
            {editingSearchQuery ? (
              <TextField
                fullWidth
                multiline
                rows={2}
                value={searchQueryValue}
                onChange={(e) => setSearchQueryValue(e.target.value)}
                disabled={saving}
                size="small"
                sx={{
                  '& .MuiInputBase-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.60rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: 'rgba(226, 232, 240, 0.95)',
                    border: '1px solid rgba(234, 67, 53, 0.3)',
                  },
                }}
              />
            ) : (
              <Box
                sx={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(234, 67, 53, 0.3)',
                  p: 1,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.60rem',
                  overflowX: 'auto',
                  color: 'rgba(226, 232, 240, 0.95)',
                  wordBreak: 'break-all'
                }}
              >
                {fetcher.searchQuery}
              </Box>
            )}
          </Box>
        )}

        {/* Received After */}
        {fetcher.receivedAfter && (
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.3 }}>
              RECEIVED AFTER:
            </Typography>
            <Box
              sx={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(234, 67, 53, 0.3)',
                p: 1,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.60rem',
                overflowX: 'auto',
                color: 'rgba(226, 232, 240, 0.95)',
                wordBreak: 'break-all'
              }}
            >
              {fetcher.receivedAfter}
            </Box>
          </Box>
        )}

        {/* Download Attachments */}
        <Box sx={{ mb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary' }}>
              DOWNLOAD ATTACHMENTS:
            </Typography>
            {!editingDownloadAttachments ? (
              <IconButton
                size="small"
                onClick={() => setEditingDownloadAttachments(true)}
                sx={{ p: 0.3 }}
              >
                <EditIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            ) : (
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={handleSaveDownloadAttachments}
                  disabled={saving}
                  sx={{ p: 0.3, color: 'success.main' }}
                >
                  <SaveIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleCancelDownloadAttachmentsEdit}
                  disabled={saving}
                  sx={{ p: 0.3, color: 'error.main' }}
                >
                  <CloseIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Stack>
            )}
          </Box>
          {editingDownloadAttachments ? (
            <Select
              fullWidth
              value={downloadAttachmentsValue ? 'true' : 'false'}
              onChange={(e) => setDownloadAttachmentsValue(e.target.value === 'true')}
              disabled={saving}
              size="small"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.60rem',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                color: 'rgba(226, 232, 240, 0.95)',
                border: '1px solid rgba(234, 67, 53, 0.3)',
                '& .MuiSelect-select': {
                  py: 0.5,
                  px: 1,
                  color: 'rgba(226, 232, 240, 0.95)',
                },
              }}
            >
              <MenuItem value="true" sx={{ fontSize: '0.60rem', fontFamily: 'monospace' }}>true</MenuItem>
              <MenuItem value="false" sx={{ fontSize: '0.60rem', fontFamily: 'monospace' }}>false</MenuItem>
            </Select>
          ) : (
            <Box
              sx={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(234, 67, 53, 0.3)',
                p: 1,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.60rem',
                color: 'rgba(226, 232, 240, 0.95)'
              }}
            >
              {downloadAttachmentsValue ? 'true' : 'false'}
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // Google Sheets display
  if (isGoogleSheets) {
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(52, 168, 83, 0.15) 0%, rgba(52, 168, 83, 0.08) 100%)',
          border: '2px solid rgba(52, 168, 83, 0.4)',
          width: '100%',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            border: '2px solid rgba(52, 168, 83, 0.8)',
            boxShadow: '0 4px 12px rgba(52, 168, 83, 0.3)',
            transform: 'translateY(-2px)',
          }
        }}
      >
        {/* Title */}
        <Box sx={{ mb: 0.8 }}>
          <Chip
            label="GOOGLE SHEETS"
            sx={{
              backgroundColor: '#34A853',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.65rem',
              height: 20
            }}
          />
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.secondary',
              fontStyle: 'italic',
              fontSize: '0.6rem',
              mt: 0.3
            }}
          >
            {fetcher.name}
          </Typography>
        </Box>

        {/* Document ID */}
        {fetcher.documentId && (
          <Box sx={{ mb: 0.8 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.3 }}>
              DOCUMENT ID:
            </Typography>
            <Box
              sx={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(52, 168, 83, 0.3)',
                p: 0.5,
                borderRadius: 0.5,
                fontFamily: 'monospace',
                fontSize: '0.6rem',
                overflowX: 'auto',
                color: 'rgba(226, 232, 240, 0.95)',
                wordBreak: 'break-all'
              }}
            >
              {fetcher.documentId}
            </Box>
          </Box>
        )}

        {/* Sheet ID */}
        {fetcher.sheetId && (
          <Box sx={{ mb: 0 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.3 }}>
              SHEET ID:
            </Typography>
            <Box
              sx={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(52, 168, 83, 0.3)',
                p: 0.5,
                borderRadius: 0.5,
                fontFamily: 'monospace',
                fontSize: '0.6rem',
                color: 'rgba(226, 232, 240, 0.95)'
              }}
            >
              {fetcher.sheetId}
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  // For other non-HTTP fetchers, show basic info
  if (!isHTTP) {
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 150, 243, 0.08) 100%)',
          border: '2px solid rgba(33, 150, 243, 0.4)',
          width: '100%',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            border: '2px solid rgba(33, 150, 243, 0.8)',
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
            transform: 'translateY(-2px)',
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} gutterBottom>
          {fetcher.name}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.6rem' }} color="text.secondary">
          Type: {fetcher.type}
        </Typography>
      </Box>
    );
  }

  // HTTP Request display
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 150, 243, 0.08) 100%)',
        border: '2px solid rgba(33, 150, 243, 0.4)',
        width: '100%',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          border: '2px solid rgba(33, 150, 243, 0.8)',
          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
          transform: 'translateY(-2px)',
        }
      }}
    >
      {/* Title */}
      <Box sx={{ mb: 0.8 }}>
        <Chip
          label={`HTTP ${fetcher.method?.toUpperCase() || 'GET'}`}
          sx={{
            backgroundColor: '#2196F3',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.65rem',
            height: 20
          }}
        />
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            fontStyle: 'italic',
            fontSize: '0.6rem',
            mt: 0.3
          }}
        >
          {fetcher.name}
        </Typography>
      </Box>

      {/* URL */}
      {fetcher.url && (
        <Box sx={{ mb: 0.8 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.3 }}>
            URL:
          </Typography>
          <Box
            sx={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              p: 0.5,
              borderRadius: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.6rem',
              overflowX: 'auto',
              color: 'rgba(226, 232, 240, 0.95)',
              wordBreak: 'break-all'
            }}
          >
            {fetcher.url}
          </Box>
        </Box>
      )}

      {/* Query Parameters */}
      {fetcher.queryParameters && fetcher.queryParameters.length > 0 && (
        <Box sx={{ mb: 0.8 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.3 }}>
            QUERY PARAMETERS:
          </Typography>
          <Box
            sx={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              p: 0.5,
              borderRadius: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.6rem',
              overflowX: 'auto'
            }}
          >
            {fetcher.queryParameters.map((qp, index) => (
              <Box key={index} sx={{ mb: index < fetcher.queryParameters!.length - 1 ? 0.3 : 0 }}>
                <Typography
                  component="div"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.6rem',
                    display: 'flex',
                    gap: 0.3
                  }}
                >
                  <Box component="span" sx={{ color: 'rgba(239, 68, 68, 1)', fontWeight: 'bold', flexShrink: 0 }}>
                    {qp.name}:
                  </Box>
                  <Box
                    component="pre"
                    sx={{
                      margin: 0,
                      color: 'rgba(226, 232, 240, 0.95)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      flex: 1
                    }}
                  >
                    {qp.value}
                  </Box>
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Headers */}
      {fetcher.headers && fetcher.headers.length > 0 && (
        <Box sx={{ mb: 0.8 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.3 }}>
            HEADERS:
          </Typography>
          <Box
            sx={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              p: 0.5,
              borderRadius: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.6rem',
              overflowX: 'auto'
            }}
          >
            {fetcher.headers.map((header, index) => (
              <Box key={index} sx={{ mb: index < fetcher.headers!.length - 1 ? 0.3 : 0 }}>
                <Typography
                  component="div"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.6rem',
                    display: 'flex',
                    gap: 0.3
                  }}
                >
                  <Box component="span" sx={{ color: 'rgba(251, 146, 60, 1)', fontWeight: 'bold', flexShrink: 0 }}>
                    {header.name}:
                  </Box>
                  <Box
                    component="pre"
                    sx={{
                      margin: 0,
                      color: 'rgba(226, 232, 240, 0.95)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      flex: 1
                    }}
                  >
                    {header.value}
                  </Box>
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Authentication */}
      {fetcher.authentication && (
        <Box sx={{ mb: 0 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary', mb: 0.3 }}>
            AUTHENTICATION:
          </Typography>
          <Box
            sx={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              p: 0.5,
              borderRadius: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.6rem',
              color: 'rgba(226, 232, 240, 0.95)'
            }}
          >
            {fetcher.authentication}
          </Box>
        </Box>
      )}
    </Box>
  );
}
