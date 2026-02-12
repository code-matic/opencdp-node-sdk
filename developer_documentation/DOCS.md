# Documentation Deployment Guide

This document explains how to build and deploy the OpenCDP Node SDK documentation to Google Cloud Run.

## Local Development

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run docs:start
```

This will start a local development server at `http://localhost:3000`.

### Build Documentation

```bash
npm run docs:build
```

Builds static documentation site to the `build/` directory.

### Serve Built Documentation

```bash
npm run docs:serve
```

Serves the built documentation locally for testing.

## Deployment to Cloud Run

### Prerequisites

1. **Google Cloud Project** with billing enabled
2. **gcloud CLI** installed and configured
3. **Docker** installed locally (for local testing)
4. **Cloud Run API** enabled
5. **Container Registry API** enabled

### Setup

1. **Authenticate with gcloud:**
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2. **Enable required APIs:**
```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.gcr.io
gcloud services enable cloudbuild.googleapis.com
```

### Option 1: Deploy Using Cloud Build (Recommended)

Cloud Build automatically builds and deploys from your repository:

1. **Connect your repository** to Cloud Build (one-time setup)

2. **Trigger build:**
```bash
gcloud builds submit --config=cloudbuild.yaml
```

3. **Set up automatic deployments** (optional):
   - Configure Cloud Build triggers
   - Automatically deploy on push to main branch

### Option 2: Manual Deployment

1. **Build Docker image locally:**
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/cdp-node-docs .
```

2. **Test locally:**
```bash
docker run -p 8080:8080 gcr.io/YOUR_PROJECT_ID/cdp-node-docs
```

Open `http://localhost:8080` to verify.

3. **Push to Container Registry:**
```bash
docker push gcr.io/YOUR_PROJECT_ID/cdp-node-docs
```

4. **Deploy to Cloud Run:**
```bash
gcloud run deploy cdp-node-docs \
  --image gcr.io/YOUR_PROJECT_ID/cdp-node-docs \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

### Configuration Options

Customize the `cloudbuild.yaml` file:

- **Region**: Change `--region us-central1` to your preferred region
- **Memory**: Adjust `--memory 512Mi` (256Mi, 512Mi, 1Gi, 2Gi, 4Gi, 8Gi)
- **CPU**: Change `--cpu 1` (0.5, 1, 2, 4)
- **Instances**: Adjust `--min-instances` and `--max-instances`
- **Authentication**: Remove `--allow-unauthenticated` to require authentication

### Custom Domain

1. **Map custom domain:**
```bash
gcloud run domain-mappings create \
  --service cdp-node-docs \
  --domain docs.your-domain.com \
  --region us-central1
```

2. **Configure DNS** according to Cloud Run instructions

### Environment Variables

If you need environment variables:

```bash
gcloud run services update cdp-node-docs \
  --set-env-vars "KEY1=value1,KEY2=value2" \
  --region us-central1
```

### Monitoring

View logs:
```bash
gcloud run services logs read cdp-node-docs --region us-central1
```

View service details:
```bash
gcloud run services describe cdp-node-docs --region us-central1
```

### Costs

Cloud Run pricing (as of 2025):
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second
- **Requests**: $0.40 per million requests
- **Free tier**: 2 million requests/month, 360,000 GB-seconds/month

Estimated cost for documentation site:
- Low traffic: ~$0-5/month (within free tier)
- Medium traffic: ~$5-20/month
- High traffic: ~$20-50/month

### Troubleshooting

**Build fails:**
```bash
# Check build logs
gcloud builds log --stream
```

**Service not accessible:**
```bash
# Check service status
gcloud run services describe cdp-node-docs --region us-central1

# Check IAM permissions
gcloud run services get-iam-policy cdp-node-docs --region us-central1
```

**Container issues:**
```bash
# Test container locally
docker build -t test-docs .
docker run -p 8080:8080 test-docs
```

## Continuous Deployment

### GitHub Integration

1. **Connect GitHub repository** to Cloud Build
2. **Create trigger:**

```bash
gcloud builds triggers create github \
  --repo-name=cdp-node \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

3. **Automatic deployments** on push to main branch

### GitLab/Bitbucket

Similar integration available through Cloud Build.

## Updating Documentation

1. **Edit documentation** in `docs/` directory
2. **Test locally:** `npm run docs:start`
3. **Commit and push** to trigger automatic deployment
4. **Or manually deploy:** `gcloud builds submit --config=cloudbuild.yaml`

## Maintenance

### Update Docusaurus

```bash
npm update @docusaurus/core @docusaurus/preset-classic
npm run docs:build # Test build
```

### Update Dependencies

```bash
npm update
npm audit fix
```

### Backup

Documentation source is in Git, so regular commits serve as backups.

## Support

For issues with:
- **Documentation content**: Update files in `docs/` directory
- **Docusaurus**: See [Docusaurus docs](https://docusaurus.io/)
- **Cloud Run**: See [Cloud Run docs](https://cloud.google.com/run/docs)
- **Deployment**: Check `cloudbuild.yaml` and `Dockerfile`

