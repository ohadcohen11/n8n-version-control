'use client';

import { Box, Typography, Paper, Chip } from '@mui/material';

interface FetcherNode {
  id: string;
  name: string;
  type: string;
  url?: string;
  method?: string;
  queryParameters?: { name: string; value: string }[];
  headers?: { name: string; value: string }[];
  body?: any;
  authentication?: string;
}

interface FetcherCubeProps {
  fetcher: FetcherNode;
}

export default function FetcherCube({ fetcher }: FetcherCubeProps) {
  const isHTTP = fetcher.type === 'n8n-nodes-base.httpRequest';

  if (!isHTTP) {
    // For non-HTTP fetchers, show basic info
    return (
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: 2,
          border: '2px solid #2196F3',
          width: '100%'
        }}
      >
        <Typography variant="h6" gutterBottom>
          {fetcher.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Type: {fetcher.type}
        </Typography>
      </Paper>
    );
  }

  // HTTP Request display
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '2px solid #2196F3',
        width: '100%'
      }}
    >
      {/* Title */}
      <Box sx={{ mb: 2 }}>
        <Chip
          label={`HTTP ${fetcher.method?.toUpperCase() || 'GET'}`}
          sx={{
            backgroundColor: '#2196F3',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.8rem',
            mb: 1
          }}
        />
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            fontStyle: 'italic',
            fontSize: '0.7rem'
          }}
        >
          {fetcher.name}
        </Typography>
      </Box>

      {/* URL */}
      {fetcher.url && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
            URL:
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
            {fetcher.url}
          </Box>
        </Box>
      )}

      {/* Query Parameters */}
      {fetcher.queryParameters && fetcher.queryParameters.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
            QUERY PARAMETERS:
          </Typography>
          <Box
            sx={{
              backgroundColor: 'grey.100',
              p: 1,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              overflowX: 'auto'
            }}
          >
            {fetcher.queryParameters.map((qp, index) => (
              <Box key={index} sx={{ mb: index < fetcher.queryParameters!.length - 1 ? 0.3 : 0 }}>
                <Typography
                  component="div"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    display: 'flex',
                    gap: 0.5
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
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
            HEADERS:
          </Typography>
          <Box
            sx={{
              backgroundColor: 'grey.100',
              p: 1,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              overflowX: 'auto'
            }}
          >
            {fetcher.headers.map((header, index) => (
              <Box key={index} sx={{ mb: index < fetcher.headers!.length - 1 ? 0.3 : 0 }}>
                <Typography
                  component="div"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    display: 'flex',
                    gap: 0.5
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
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
            AUTHENTICATION:
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
            {fetcher.authentication}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
