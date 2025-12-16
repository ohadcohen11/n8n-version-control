import { NextResponse } from 'next/server';
import axios from 'axios';
import { analyzeWorkflows } from '@/lib/workflowParser';

export async function GET() {
  try {
    const N8N_API_URL = process.env.N8N_API_URL;
    const N8N_API_KEY = process.env.N8N_API_KEY;

    if (!N8N_API_URL || !N8N_API_KEY) {
      return NextResponse.json(
        { error: 'n8n API configuration is missing' },
        { status: 500 }
      );
    }

    // Fetch workflows from specific project
    const PROJECT_ID = 'NOZFy4AGg8mUmx5a';
    const response = await axios.get(`${N8N_API_URL}/workflows?projectId=${PROJECT_ID}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    const workflows = response.data.data || response.data;

    // Filter out archived workflows
    const activeWorkflows = workflows.filter((wf: any) => !wf.isArchived);

    // Analyze workflows
    const analysis = analyzeWorkflows(activeWorkflows);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error analyzing workflows:', error.message);
    return NextResponse.json(
      { error: 'Failed to analyze workflows', details: error.message },
      { status: 500 }
    );
  }
}
