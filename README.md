# n8n Git Dashboard

A beautiful dashboard for managing and syncing your n8n workflows with GitHub.

## Features

- **Dashboard Overview**: See the current status of all your workflows at a glance
- **Git Changes**: View differences between n8n workflows and GitHub repositories
- **Commits History**: Track recent commits to your workflow repository
- **Real-time Sync Status**: Know which workflows are synced, modified, or out of sync
- **Beautiful UI**: Modern, dark-themed interface built with styled-components

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# n8n Configuration
N8N_API_URL=https://ryzebeyond.app.n8n.cloud/api/v1
N8N_API_KEY=your_n8n_api_key_here

# GitHub Configuration
GITHUB_TOKEN=your_github_token_here
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repo_name
```

#### Getting Your n8n API Key

1. Log in to your n8n instance
2. Go to Settings > API
3. Generate a new API key
4. Copy the key to `N8N_API_KEY` in `.env.local`

#### Getting Your GitHub Token

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token (classic)
3. Select scopes: `repo` (for private repos) or `public_repo` (for public repos)
4. Copy the token to `GITHUB_TOKEN` in `.env.local`

### 3. Repository Structure

The dashboard expects your n8n workflows to be stored in a `workflows` folder in your GitHub repository. Each workflow should be a JSON file.

Example structure:
```
your-repo/
  workflows/
    my_workflow_1.json
    my_workflow_2.json
    ...
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Dashboard

The main dashboard shows:
- Total number of workflows
- Number of synced workflows
- Number of modified workflows
- Workflows only in n8n
- Workflows only in GitHub

### Workflow Changes Tab

View detailed differences between your n8n workflows and GitHub:
- Filter by status (All, Synced, Modified, Only in n8n, Only in GitHub)
- Click on any workflow to see the diff
- Color-coded changes (green for additions, red for deletions)

### Recent Commits Tab

See the latest commits to your workflow repository:
- Commit messages
- Author information
- Commit timestamp
- Commit SHA

### Refresh Button

Click the refresh button to fetch the latest data from n8n and GitHub.

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **styled-components**: CSS-in-JS styling
- **n8n API**: Workflow automation platform
- **GitHub API (Octokit)**: GitHub integration
- **diff**: Text diffing library

## Development

### Project Structure

```
my-app/
  app/
    api/              # API routes
      compare/        # Compare n8n and GitHub workflows
      github/         # GitHub API endpoints
      n8n/            # n8n API endpoints
    styles/           # Global styles
    layout.tsx        # Root layout
    page.tsx          # Main dashboard page
  components/         # React components
    Button.tsx
    Card.tsx
    CommitsView.tsx
    DashboardStats.tsx
    DiffViewer.tsx
    Layout.tsx
    LoadingSpinner.tsx
    StatusBadge.tsx
  lib/
    registry.tsx      # styled-components registry
```

### Building for Production

```bash
npm run build
npm start
```

## License

MIT
