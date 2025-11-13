import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { workflowId, nodeId, field, value } = await request.json();

    if (!workflowId || !nodeId || !field) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const n8nUrl = process.env.N8N_API_URL;
    const n8nApiKey = process.env.N8N_API_KEY;

    if (!n8nUrl || !n8nApiKey) {
      return NextResponse.json(
        { error: 'N8N configuration missing' },
        { status: 500 }
      );
    }

    // First, fetch the full workflow
    const getResponse = await fetch(`${n8nUrl}/workflows/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch workflow: ${getResponse.statusText}`);
    }

    const workflow = await getResponse.json();

    // Find and update the specific node
    const nodeIndex = workflow.nodes.findIndex((node: any) => node.id === nodeId);
    if (nodeIndex === -1) {
      return NextResponse.json(
        { error: 'Node not found in workflow' },
        { status: 404 }
      );
    }

    // Update the specific field based on the field name
    if (field === 'searchQuery') {
      // Gmail search query is in parameters.filters.q
      if (!workflow.nodes[nodeIndex].parameters) {
        workflow.nodes[nodeIndex].parameters = {};
      }
      if (!workflow.nodes[nodeIndex].parameters.filters) {
        workflow.nodes[nodeIndex].parameters.filters = {};
      }
      workflow.nodes[nodeIndex].parameters.filters.q = value;
    }

    // Send PUT request to update the workflow
    const updateResponse = await fetch(`${n8nUrl}/workflows/${workflowId}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings,
        staticData: workflow.staticData,
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update workflow: ${errorText}`);
    }

    const updatedWorkflow = await updateResponse.json();

    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow,
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update workflow' },
      { status: 500 }
    );
  }
}
