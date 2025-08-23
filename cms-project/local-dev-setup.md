# Local Development Setup

This document contains all the information about the local development environment setup including Docker, GitHub CLI, Supabase, and Playwright MCP.

## 🐳 Docker CLI

**Status**: ✅ Installed and running
- **Version**: Docker version 28.3.3, build 980b856
- **Multiple containers running** including Supabase services and other development environments

### Common Docker Commands
```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# View container logs
docker logs <container-name>

# Stop a container
docker stop <container-name>

# Remove a container
docker rm <container-name>

# List images
docker images

# Build an image
docker build -t myapp .

# Run a container
docker run -d -p 3000:3000 myapp
```

## 🐙 GitHub CLI

**Status**: ✅ Installed and authenticated
- **Version**: gh version 2.46.0
- **User**: MarvinNL046
- **Location**: `./gh_2.46.0_linux_amd64/bin/gh`

### GitHub CLI Usage
```bash
# Check authentication status
./gh_2.46.0_linux_amd64/bin/gh auth status

# List repositories
./gh_2.46.0_linux_amd64/bin/gh repo list

# Create a pull request
./gh_2.46.0_linux_amd64/bin/gh pr create

# Clone a repository
./gh_2.46.0_linux_amd64/bin/gh repo clone owner/repo

# View issues
./gh_2.46.0_linux_amd64/bin/gh issue list

# Create an issue
./gh_2.46.0_linux_amd64/bin/gh issue create
```

### Make GitHub CLI Permanent
To use `gh` command without the full path:
```bash
echo 'export PATH="'$PWD'/gh_2.46.0_linux_amd64/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## 🚀 Supabase Local Development

**Status**: ✅ Running
- **Version**: 1.200.3
- **Location**: `./supabase-cli`

### Supabase URLs and Credentials

| Service | URL | Port |
|---------|-----|------|
| API URL | http://127.0.0.1:54331 | 54331 |
| GraphQL URL | http://127.0.0.1:54331/graphql/v1 | 54331 |
| DB URL | postgresql://postgres:postgres@127.0.0.1:54332/postgres | 54332 |
| Studio URL | http://127.0.0.1:54333 | 54333 |
| Inbucket URL | http://127.0.0.1:54334 | 54334 |
| S3 Storage URL | http://127.0.0.1:54331/storage/v1/s3 | 54331 |

### Authentication Keys
- **JWT Secret**: `super-secret-jwt-token-with-at-least-32-characters-long`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`

### S3 Credentials
- **Access Key**: `625729a08b95bf1b7ff351a663f3a23c`
- **Secret Key**: `850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907`
- **Region**: `local`

### Supabase CLI Commands
```bash
# Start Supabase
./supabase-cli start

# Stop Supabase
./supabase-cli stop

# View status
./supabase-cli status

# Reset database
./supabase-cli db reset

# Run migrations
./supabase-cli migration up

# Create a new migration
./supabase-cli migration new <migration-name>

# Access database directly
./supabase-cli db push
```

### Connecting to Supabase in Your Application

Update your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## 🎭 Playwright MCP Server

**Status**: ✅ Configured
- **Added to Claude MCP configuration**

### Running Playwright Tests with MCP

The Playwright MCP server allows Claude to run browser automation and E2E tests. You can ask Claude to:
- Create E2E tests for your application
- Run automated browser tests
- Capture screenshots
- Test user workflows
- Perform visual regression testing

### Example Playwright Test Script

Create a file `tests/example.test.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('CRM leads page loads correctly', async ({ page }) => {
  // Navigate to the leads page
  await page.goto('http://localhost:3000/crm/leads');
  
  // Check if the page title is correct
  await expect(page).toHaveTitle(/Leads/);
  
  // Check if the kanban board is visible
  await expect(page.locator('.kanban-board')).toBeVisible();
  
  // Check if drop zones are present
  await expect(page.locator('text=Drop here to add')).toHaveCount(5);
});

test('Can drag and drop leads', async ({ page }) => {
  await page.goto('http://localhost:3000/crm/leads');
  
  // Find a lead card
  const leadCard = page.locator('.lead-card').first();
  
  // Find target drop zone
  const dropZone = page.locator('text=Drop here to add').nth(1);
  
  // Perform drag and drop
  await leadCard.dragTo(dropZone);
  
  // Verify lead moved to new column
  // Add assertions based on your implementation
});
```

### Running Playwright Tests
```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Run tests
npx playwright test

# Run tests with UI
npx playwright test --ui

# Run specific test file
npx playwright test tests/example.test.ts

# Generate test code by recording actions
npx playwright codegen http://localhost:3000
```

## 🔧 Quick Start Commands

```bash
# Start all services
docker start $(docker ps -aq)  # Start all Docker containers
./supabase-cli start          # Start Supabase

# Check status
docker ps                     # Check Docker containers
./supabase-cli status        # Check Supabase status
./gh_2.46.0_linux_amd64/bin/gh auth status  # Check GitHub auth

# Access services
open http://127.0.0.1:54333  # Supabase Studio
open http://127.0.0.1:54334  # Email testing (Inbucket)
```

## 📝 Notes

1. **Port Configuration**: Supabase is configured to use custom ports (54331-54337) to avoid conflicts with the existing Supabase instance.

2. **Multiple Supabase Instances**: There's another Supabase instance running for the `booking-saas` project on the default ports (54321-54327).

3. **GitHub CLI OAuth**: Already authenticated as MarvinNL046 with proper scopes for repository, gist, and organization access.

4. **Playwright MCP**: The MCP server allows Claude to run browser automation directly. Just ask Claude to create or run tests!

## 🚨 Troubleshooting

### Port Conflicts
If you get port conflicts when starting Supabase:
1. Check running containers: `docker ps`
2. Stop conflicting containers: `docker stop <container-name>`
3. Or modify ports in `supabase/config.toml`

### Supabase Connection Issues
1. Ensure Supabase is running: `./supabase-cli status`
2. Check if ports are accessible: `curl http://127.0.0.1:54331`
3. Verify environment variables are set correctly

### GitHub CLI Issues
1. Re-authenticate: `./gh_2.46.0_linux_amd64/bin/gh auth login`
2. Check status: `./gh_2.46.0_linux_amd64/bin/gh auth status`

### Docker Issues
1. Ensure Docker daemon is running: `sudo systemctl status docker`
2. Check permissions: `sudo usermod -aG docker $USER` (then logout/login)