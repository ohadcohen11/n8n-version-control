import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
  try {
    const { filename, commitMessage } = await request.json();

    console.log(`Deleting file ${filename} from GitHub`);

    // Initialize GitHub API
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Get the file to retrieve its SHA (required for deletion)
    const { data: file } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: filename,
    });

    if (!('sha' in file)) {
      throw new Error('File not found or is a directory');
    }

    // Delete the file from GitHub
    const finalCommitMessage = commitMessage || `Remove workflow file: ${filename}`;

    await octokit.repos.deleteFile({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: filename,
      message: finalCommitMessage,
      sha: file.sha,
    });

    console.log(`Successfully deleted file ${filename} from GitHub`);

    return NextResponse.json({
      success: true,
      message: 'File deleted from GitHub',
    });
  } catch (error: any) {
    console.error('Error deleting file from GitHub:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file from GitHub',
        details: error.response?.data?.message || error.message,
      },
      { status: 500 }
    );
  }
}
