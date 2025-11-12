import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function GET() {
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const { data } = await octokit.repos.listCommits({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      per_page: 20,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching GitHub commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commits' },
      { status: 500 }
    );
  }
}
