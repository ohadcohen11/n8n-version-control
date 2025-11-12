import { NextResponse } from 'next/server';
import axios from 'axios';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
  try {
    const { filename, workflowId } = await request.json();

    console.log(`Syncing workflow: ${filename} (ID: ${workflowId || 'new'})`);

    // Fetch the workflow from GitHub
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const { data: file } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: filename,
    });

    if (!('download_url' in file) || !file.download_url) {
      throw new Error('File not found or is a directory');
    }

    // Download the workflow content
    const fileContent = await axios.get(file.download_url);
    const workflowData = fileContent.data;

    if (workflowId) {
      // Update existing workflow in n8n
      console.log(`Updating existing workflow ${workflowId}`);

      // For updates, use PUT but don't include id (it's in the URL)
      const updateData = {
        name: workflowData.name,
        nodes: workflowData.nodes,
        connections: workflowData.connections,
        settings: workflowData.settings,
        staticData: workflowData.staticData,
      };

      const response = await axios.put(
        `${process.env.N8N_API_URL}/workflows/${workflowId}`,
        updateData,
        {
          headers: {
            'X-N8N-API-KEY': process.env.N8N_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`Successfully updated workflow ${workflowId}`);
      return NextResponse.json({
        success: true,
        message: 'Workflow updated successfully',
        workflow: response.data,
      });
    } else {
      // Create new workflow in n8n
      console.log(`Creating new workflow: ${workflowData.name}`);

      // For creating, only send allowed fields (no id, createdAt, updatedAt, shared, active, tags, etc.)
      const createData = {
        name: workflowData.name,
        nodes: workflowData.nodes || [],
        connections: workflowData.connections || {},
        settings: workflowData.settings || {},
        staticData: workflowData.staticData,
      };

      console.log('Creating with data:', JSON.stringify(createData, null, 2));

      const response = await axios.post(
        `${process.env.N8N_API_URL}/workflows`,
        createData,
        {
          headers: {
            'X-N8N-API-KEY': process.env.N8N_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`Successfully created workflow: ${workflowData.name}`);
      return NextResponse.json({
        success: true,
        message: 'Workflow created successfully',
        workflow: response.data,
      });
    }
  } catch (error: any) {
    console.error('Error syncing workflow:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync workflow',
        details: error.response?.data?.message || error.message,
      },
      { status: 500 }
    );
  }
}
