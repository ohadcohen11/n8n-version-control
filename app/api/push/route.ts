import { NextResponse } from 'next/server';
import axios from 'axios';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
  try {
    const { workflowId, filename } = await request.json();

    console.log(`Pushing workflow ${workflowId} to GitHub as ${filename}`);

    // Fetch the workflow from n8n
    const n8nResponse = await axios.get(
      `${process.env.N8N_API_URL}/workflows/${workflowId}`,
      {
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY,
        },
      }
    );

    const workflow = n8nResponse.data;

    // Prepare the workflow data (clean version for GitHub)
    const workflowData = {
      id: workflow.id,
      name: workflow.name,
      active: workflow.active,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings,
      staticData: workflow.staticData,
      tags: workflow.tags,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };

    const fileContent = JSON.stringify(workflowData, null, 2);

    // Initialize GitHub API
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Check if file exists in GitHub
    let fileSha: string | undefined;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        path: filename,
      });

      if ('sha' in existingFile) {
        fileSha = existingFile.sha;
        console.log(`File exists, will update. SHA: ${fileSha}`);
      }
    } catch (error: any) {
      if (error.status === 404) {
        console.log('File does not exist, will create new file');
      } else {
        throw error;
      }
    }

    // Create or update the file in GitHub
    const commitMessage = fileSha
      ? `Update workflow: ${workflow.name}`
      : `Add workflow: ${workflow.name}`;

    const response = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: filename,
      message: commitMessage,
      content: Buffer.from(fileContent).toString('base64'),
      sha: fileSha, // Only needed for updates
    });

    console.log(`Successfully pushed workflow to GitHub: ${filename}`);

    return NextResponse.json({
      success: true,
      message: fileSha ? 'Workflow updated in GitHub' : 'Workflow created in GitHub',
      commit: response.data.commit,
    });
  } catch (error: any) {
    console.error('Error pushing workflow to GitHub:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to push workflow to GitHub',
        details: error.response?.data?.message || error.message,
      },
      { status: 500 }
    );
  }
}
