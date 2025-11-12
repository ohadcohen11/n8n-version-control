import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function GET() {
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    console.log('Checking repository structure...');

    // Try to get root directory
    const { data: rootFiles } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: '',
    });

    console.log('Root directory contents:');
    if (Array.isArray(rootFiles)) {
      rootFiles.forEach(file => {
        console.log(`- ${file.name} (${file.type})`);
      });
    }

    return NextResponse.json({
      root: rootFiles,
      message: 'Check your terminal/console for the directory structure'
    });
  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
