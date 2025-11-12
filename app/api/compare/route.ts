import { NextResponse } from 'next/server';
import axios from 'axios';
import { Octokit } from '@octokit/rest';
import * as Diff from 'diff';

interface N8nWorkflow {
  id: string;
  name: string;
  nodes: any[];
  connections: any;
  settings: any;
  active?: boolean;
  isArchived?: boolean;
}

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
}

export async function GET() {
  try {
    console.log('Starting workflow comparison...');

    // Fetch workflows from n8n
    console.log('Fetching n8n workflows...');
    const n8nResponse = await axios.get(`${process.env.N8N_API_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
      },
    });

    // Filter out archived workflows (only include non-archived ones)
    const allN8nWorkflows: N8nWorkflow[] = n8nResponse.data.data || [];
    const n8nWorkflows = allN8nWorkflows.filter(w => w.isArchived !== true);
    console.log(`Found ${allN8nWorkflows.length} total workflows in n8n (${n8nWorkflows.length} non-archived, ${allN8nWorkflows.length - n8nWorkflows.length} archived)`);
    console.log(`Ignoring ${allN8nWorkflows.length - n8nWorkflows.length} archived workflows`);

    // Fetch workflow files from GitHub
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    console.log('Fetching GitHub workflows...');
    let githubFiles: any;
    try {
      const response = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        path: '', // Look in root directory
      });
      githubFiles = response.data;
    } catch (error: any) {
      console.error('Error fetching GitHub files:', error.message);
      githubFiles = [];
    }

    const comparisons = [];

    // Create a map of GitHub workflows
    const githubWorkflowMap = new Map();

    if (Array.isArray(githubFiles)) {
      console.log(`Found ${githubFiles.length} files in GitHub`);
      for (const file of githubFiles as GitHubFile[]) {
        if (file.name.endsWith('.json') && file.download_url && file.type === 'file') {
          try {
            const fileContent = await axios.get(file.download_url);
            // Only add if it looks like an n8n workflow
            if (fileContent.data && (fileContent.data.nodes || fileContent.data.name)) {
              console.log(`Loading GitHub workflow: ${file.name}`);
              githubWorkflowMap.set(file.name, {
                ...file,
                content: fileContent.data,
              });
            }
          } catch (error) {
            console.error(`Error loading file ${file.name}:`, error);
          }
        }
      }
    }

    console.log(`Loaded ${githubWorkflowMap.size} workflows from GitHub`);

    // Compare n8n workflows with GitHub
    for (const workflow of n8nWorkflows) {
      // Try multiple filename formats
      const possibleFilenames = [
        `${workflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`,
        `${workflow.name}.json`,
        `${workflow.name.replace(/\s+/g, '_')}.json`,
        `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`,
      ];

      let githubWorkflow = null;
      let matchedFilename = null;

      for (const filename of possibleFilenames) {
        if (githubWorkflowMap.has(filename)) {
          githubWorkflow = githubWorkflowMap.get(filename);
          matchedFilename = filename;
          break;
        }
      }

      // Also try to match by workflow name in the content
      if (!githubWorkflow) {
        for (const [filename, ghWorkflow] of githubWorkflowMap) {
          if (ghWorkflow.content.name === workflow.name) {
            githubWorkflow = ghWorkflow;
            matchedFilename = filename;
            break;
          }
        }
      }

      const filename = matchedFilename || possibleFilenames[0];

      // Normalize workflow data for comparison (exclude metadata fields)
      const normalizeWorkflow = (wf: any) => ({
        name: wf.name,
        nodes: wf.nodes,
        connections: wf.connections,
        settings: wf.settings,
      });

      const n8nNormalized = normalizeWorkflow(workflow);
      const n8nContent = JSON.stringify(n8nNormalized, null, 2);

      if (githubWorkflow) {
        const githubNormalized = normalizeWorkflow(githubWorkflow.content);
        const githubContent = JSON.stringify(githubNormalized, null, 2);

        const isMatch = githubContent === n8nContent;

        // Log comparison details
        console.log(`Comparing: ${workflow.name} -> ${isMatch ? 'SYNCED' : 'MODIFIED'}`);

        // Detailed debugging for specific workflow
        if (workflow.name.includes('email-3003')) {
          console.log('=== DETAILED DEBUG FOR email-3003 ===');
          console.log('Workflow name:', workflow.name);
          console.log('Matched filename:', filename);
          console.log('GitHub has nodes:', githubWorkflow.content.nodes?.length || 0);
          console.log('n8n has nodes:', workflow.nodes?.length || 0);
          console.log('Is match:', isMatch);
          if (!isMatch) {
            console.log('First 500 chars of GitHub:', githubContent.substring(0, 500));
            console.log('First 500 chars of n8n:', n8nContent.substring(0, 500));
          }
          console.log('=== END DEBUG ===');
        }

        const diff = isMatch ? null : Diff.createPatch(
          filename,
          githubContent,
          n8nContent,
          'GitHub version',
          'n8n version'
        );

        comparisons.push({
          workflowId: workflow.id,
          workflowName: workflow.name,
          filename,
          status: isMatch ? 'synced' : 'modified',
          diff,
          inGitHub: true,
          inN8n: true,
        });

        // Mark as processed
        githubWorkflowMap.delete(filename);
      } else {
        comparisons.push({
          workflowId: workflow.id,
          workflowName: workflow.name,
          filename,
          status: 'only_in_n8n',
          diff: null,
          inGitHub: false,
          inN8n: true,
        });
      }
    }

    // Check for workflows only in GitHub
    for (const [filename, githubWorkflow] of githubWorkflowMap) {
      comparisons.push({
        workflowId: null,
        workflowName: githubWorkflow.content.name || filename.replace('.json', ''),
        filename,
        status: 'only_in_github',
        diff: null,
        inGitHub: true,
        inN8n: false,
      });
    }

    console.log(`Comparison complete. Total comparisons: ${comparisons.length}`);
    console.log('Stats:', {
      synced: comparisons.filter((c) => c.status === 'synced').length,
      modified: comparisons.filter((c) => c.status === 'modified').length,
      onlyInN8n: comparisons.filter((c) => c.status === 'only_in_n8n').length,
      onlyInGitHub: comparisons.filter((c) => c.status === 'only_in_github').length,
    });

    return NextResponse.json({ comparisons });
  } catch (error: any) {
    console.error('Error comparing workflows:', error);
    return NextResponse.json(
      {
        error: 'Failed to compare workflows',
        details: error.message,
        comparisons: []
      },
      { status: 500 }
    );
  }
}
