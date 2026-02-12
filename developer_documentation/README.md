# OpenCDP Node SDK Documentation

This directory contains the documentation website for the OpenCDP Node SDK, built with [Docusaurus](https://docusaurus.io/).

## Quick Start

### From Project Root

You can now deploy directly from the project root:

```bash
# From project root
gcloud builds submit --config=developer_documentation/cloudbuild.yaml .
```

Or navigate to the directory:

```bash
cd developer_documentation
npm run deploy
```

### From This Directory

**Prerequisites:**
- Node.js >= 20.0 (Docusaurus requirement)

```bash
# Check your Node.js version
node --version  # Should be v20.0.0 or higher

# Install dependencies (first time only)
npm install

# Start development server
npm start

# Build documentation
npm run build

# Serve built documentation
npm run serve

# Deploy to Google Cloud Run
npm run deploy
```

## Structure

```
developer_documentation/
├── docs/                   # Documentation markdown files
│   ├── api/               # API reference docs
│   ├── examples/          # Example code docs
│   ├── getting-started/   # Getting started guides
│   └── guides/            # How-to guides
├── src/
│   └── css/               # Custom CSS styles
├── static/                # Static assets (images, etc.)
├── docusaurus.config.js   # Docusaurus configuration
├── sidebars.js            # Sidebar navigation structure
├── Dockerfile             # Docker build for deployment
├── cloudbuild.yaml        # Google Cloud Build config
└── package.json           # Documentation dependencies
```

## Development

The documentation automatically reloads when you make changes to:
- Markdown files in `docs/`
- Configuration files
- Custom CSS

### Search Functionality

The documentation includes **local search** powered by `@easyops-cn/docusaurus-search-local`:
- Search bar appears in the navigation bar
- Indexes all documentation content
- Works offline (no external services needed)
- Highlights search terms on result pages
- Updates automatically when you rebuild the docs

### Adding New Pages

1. Create a new markdown file in the appropriate `docs/` subdirectory
2. Add frontmatter to the top:
   ```markdown
   ---
   sidebar_position: 1
   title: Page Title
   ---
   
   # Your Content
   ```
3. The page will automatically appear in the navigation

### Hiding Pages

To hide a page from the documentation website:

```markdown
---
draft: true
---
```

Or prefix the filename with underscore: `_filename.md`

## Deployment

### Prerequisites

- Google Cloud SDK installed and authenticated
- Access to the `cdp-node-docs` Cloud Run service
- Properly configured Google Cloud project

### Deploy

From the `developer_documentation` directory:

```bash
cd developer_documentation
npm run deploy
```

Or using gcloud directly:

```bash
cd developer_documentation
gcloud builds submit --config=cloudbuild.yaml .
```

**Important:** The `.` at the end specifies the current directory as the build context, which is necessary for Cloud Build to find the Dockerfile.

### Customizing Deployment

You can override default settings using substitution variables:

```bash
# Deploy to a different region
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1 \
  .

# Use a custom service name
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=my-docs,_REGION=us-central1 \
  .
```

**Available substitutions:**
- `_SERVICE_NAME`: Cloud Run service name (default: `cdp-node-docs`)
- `_REGION`: GCP region (default: `europe-west1`)
- `_IMAGE_NAME`: Docker image name (default: `cdp-node-docs`)

### What Happens During Deployment

1. **Build**: Docker image is built with the documentation
2. **Tag**: Image is tagged with commit SHA and `latest`
3. **Push**: Images are pushed to Google Container Registry
4. **Deploy**: Service is deployed to Cloud Run with:
   - 512MB memory, 1 CPU
   - Auto-scaling: 0-10 instances
   - 80 concurrent requests per instance
   - 60-second timeout
   - Public access (unauthenticated)

## Troubleshooting

### Node.js Version Error

If you get `Minimum Node.js version not met` during build:

```bash
# Check your Node.js version
node --version

# If it's below v20.0.0, upgrade Node.js
# Using nvm (recommended):
nvm install 22
nvm use 22

# Or using n:
n 22

# Or download from nodejs.org
```

The Dockerfile uses **Node.js 22 (Alpine)** which meets Docusaurus requirements.

### Build Context Errors

**Dockerfile Not Found:**
If you get `lstat /workspace/Dockerfile: no such file or directory`:

```bash
# Option 1: Run from project root
gcloud builds submit --config=developer_documentation/cloudbuild.yaml .

# Option 2: Run from developer_documentation directory
cd developer_documentation
gcloud builds submit --config=cloudbuild.yaml .
```

**Build Directory Not Found:**
If you get `COPY failed: stat app/build: file does not exist`:
- This means the Docker build is not finding the built documentation
- The `dir: 'developer_documentation'` directive in cloudbuild.yaml ensures the build runs in the correct directory
- Make sure you haven't modified the `dir` setting in cloudbuild.yaml

### Clear Cache

If you experience issues with the build:

```bash
npm run clear
```

### Port Already in Use

If port 3000 is already in use, Docusaurus will automatically try the next available port.

## More Information

- [Docusaurus Documentation](https://docusaurus.io/docs)
- [Markdown Features](https://docusaurus.io/docs/markdown-features)
- [Versioning](https://docusaurus.io/docs/versioning)

