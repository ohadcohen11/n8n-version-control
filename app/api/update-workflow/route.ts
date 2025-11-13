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

    // Find and update the specific node (by ID or by name for SET nodes)
    let nodeIndex = workflow.nodes.findIndex((node: any) => node.id === nodeId);

    // If not found by ID and it's an output update, try finding by name
    if (nodeIndex === -1 && (field === 'output' || field === 'outputAll')) {
      nodeIndex = workflow.nodes.findIndex((node: any) => node.name === nodeId);
    }

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
    } else if (field === 'downloadAttachments') {
      // Gmail download attachments is in parameters.options.downloadAttachments
      if (!workflow.nodes[nodeIndex].parameters) {
        workflow.nodes[nodeIndex].parameters = {};
      }
      if (!workflow.nodes[nodeIndex].parameters.options) {
        workflow.nodes[nodeIndex].parameters.options = {};
      }
      workflow.nodes[nodeIndex].parameters.options.downloadAttachments = value;
    } else if (field === 'output') {
      // SET node output is in parameters.assignments.assignments array
      if (!workflow.nodes[nodeIndex].parameters) {
        workflow.nodes[nodeIndex].parameters = {};
      }
      if (!workflow.nodes[nodeIndex].parameters.assignments) {
        workflow.nodes[nodeIndex].parameters.assignments = {};
      }
      if (!workflow.nodes[nodeIndex].parameters.assignments.assignments) {
        workflow.nodes[nodeIndex].parameters.assignments.assignments = [];
      }

      // Find and update the specific assignment by name
      const assignments = workflow.nodes[nodeIndex].parameters.assignments.assignments;
      const assignmentIndex = assignments.findIndex((a: any) => a.name === value.name);

      if (assignmentIndex !== -1) {
        // Update the value, keeping other properties like id and type
        assignments[assignmentIndex].value = value.value;
      }
    } else if (field === 'outputAll') {
      // Update multiple outputs at once
      if (!workflow.nodes[nodeIndex].parameters) {
        workflow.nodes[nodeIndex].parameters = {};
      }
      if (!workflow.nodes[nodeIndex].parameters.assignments) {
        workflow.nodes[nodeIndex].parameters.assignments = {};
      }
      if (!workflow.nodes[nodeIndex].parameters.assignments.assignments) {
        workflow.nodes[nodeIndex].parameters.assignments.assignments = [];
      }

      // Update each assignment by name
      const assignments = workflow.nodes[nodeIndex].parameters.assignments.assignments;
      const updates = value as Array<{ name: string; value: string }>;

      updates.forEach((update) => {
        const assignmentIndex = assignments.findIndex((a: any) => a.name === update.name);
        if (assignmentIndex !== -1) {
          assignments[assignmentIndex].value = update.value;
        }
      });
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
