import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { workflowId } = await request.json();

    console.log(`Deleting workflow ${workflowId} from n8n`);

    // Delete the workflow from n8n
    await axios.delete(
      `${process.env.N8N_API_URL}/workflows/${workflowId}`,
      {
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY,
        },
      }
    );

    console.log(`Successfully deleted workflow ${workflowId} from n8n`);

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted from n8n',
    });
  } catch (error: any) {
    console.error('Error deleting workflow from n8n:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete workflow from n8n',
        details: error.response?.data?.message || error.message,
      },
      { status: 500 }
    );
  }
}
