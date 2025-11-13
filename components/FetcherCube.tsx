'use client';

import { Box, Typography, Paper, Chip } from '@mui/material';

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

interface FetcherCubeProps {
  fetcher: FetcherNode;
}

export default function FetcherCube({ fetcher }: FetcherCubeProps) {
  const isHTTP = fetcher.type === 'n8n-nodes-base.httpRequest';
  const isGmail = fetcher.type === 'n8n-nodes-base.gmail';

  // Gmail display
  if (isGmail) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 1,
          borderRadius: 1,
          border: '1px solid #EA4335',
          width: '100%'
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
        {fetcher.searchQuery && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
              SEARCH:
            </Typography>
            <Box
              sx={{
                backgroundColor: 'grey.100',
                p: 1,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                overflowX: 'auto',
                color: 'black',
                wordBreak: 'break-all'
              }}
            >
              {fetcher.searchQuery}
            </Box>
          </Box>
        )}

        {/* Received After */}
        {fetcher.receivedAfter && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
              RECEIVED AFTER:
            </Typography>
            <Box
              sx={{
                backgroundColor: 'grey.100',
                p: 1,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                overflowX: 'auto',
                color: 'black',
                wordBreak: 'break-all'
              }}
            >
              {fetcher.receivedAfter}
            </Box>
          </Box>
        )}

        {/* Download Attachments */}
        {fetcher.downloadAttachments !== undefined && (
          <Box sx={{ mb: 0 }}>
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
              DOWNLOAD ATTACHMENTS:
            </Typography>
            <Box
              sx={{
                backgroundColor: 'grey.100',
                p: 1,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                color: 'black'
              }}
            >
              {fetcher.downloadAttachments ? 'Yes' : 'No'}
            </Box>
          </Box>
        )}
      </Paper>
    );
  }

  // For other non-HTTP fetchers, show basic info
  if (!isHTTP) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 1,
          borderRadius: 1,
          border: '1px solid #2196F3',
          width: '100%'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} gutterBottom>
          {fetcher.name}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.6rem' }} color="text.secondary">
          Type: {fetcher.type}
        </Typography>
      </Paper>
    );
  }

  // HTTP Request display
  return (
    <Paper
      elevation={2}
      sx={{
        p: 1,
        borderRadius: 1,
        border: '1px solid #2196F3',
        width: '100%'
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
              backgroundColor: 'grey.100',
              p: 0.5,
              borderRadius: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.6rem',
              overflowX: 'auto',
              color: 'black',
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
              backgroundColor: 'grey.100',
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
                  <Box component="span" sx={{ color: '#d32f2f', fontWeight: 'bold', flexShrink: 0 }}>
                    {qp.name}:
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
              backgroundColor: 'grey.100',
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
                  <Box component="span" sx={{ color: '#f57c00', fontWeight: 'bold', flexShrink: 0 }}>
                    {header.name}:
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
              backgroundColor: 'grey.100',
              p: 0.5,
              borderRadius: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.6rem',
              color: 'black'
            }}
          >
            {fetcher.authentication}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
