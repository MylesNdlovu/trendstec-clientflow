# Deploy MCP Server to Railway - Quick Start

## Prerequisites
- GitHub account
- Railway account (https://railway.app)

## Step 1: Push to GitHub (if not already)
```bash
git init
git add .
git commit -m "Initial commit with MCP server"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Deploy to Railway

### Via Railway Dashboard (Easiest):
1. Go to https://railway.app
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect the Dockerfile

### Via Railway CLI:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Set environment variables
railway variables set MCP_SERVER_PORT=3000
railway variables set NODE_ENV=production

# Get the URL
railway domain
```

## Step 3: Environment Variables
Set these in Railway dashboard or CLI:

### Required:
- `MCP_SERVER_PORT`: `3000`
- `NODE_ENV`: `production`

### Optional (for MT5 scraping):
- `MT5_LOGIN`: Your MT5 login
- `MT5_PASSWORD`: Your MT5 password
- `MT5_SERVER`: Your MT5 server
- `MT5_BROKER_URL`: e.g., https://mt5.pxbt.com

## Step 4: Update Vercel App
Once deployed, update your Vercel app to point to the Railway MCP server:

```bash
# Add the Railway URL to Vercel environment variables
vercel env add MCP_SERVER_URL production
# Enter: https://your-app.railway.app
```

## Step 5: Test the Connection
```bash
curl https://your-app.railway.app/health
# Should return: {"status":"ok","service":"MCP Server"}

curl https://your-app.railway.app/mt5/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "username": "YOUR_MT5_LOGIN",
    "password": "YOUR_MT5_PASSWORD",
    "server": "YOUR_SERVER",
    "brokerUrl": "https://mt5.pxbt.com"
  }'
```

## Files Already Configured:
✅ `Dockerfile.mcp` - Docker container configuration
✅ `railway.json` - Railway deployment settings
✅ `mcp-servers/mt5-playwright/src/http-server.ts` - HTTP API server
✅ `src/lib/services/mcpClient.ts` - Client to call MCP server from Vercel

## Architecture:
```
[Systeme.io]
    ↓ webhook
[Vercel - Your App] ←→ [Railway - MCP Server w/ Playwright]
    ↓                           ↓
[Prisma Postgres DB]        [MT5 WebTrader]
```

## Cost:
- **Railway Free Trial**: $5 credit (enough to test)
- **Railway Hobby Plan**: ~$5-10/month (pay-as-you-go)
- **Render Free Tier**: Free but sleeps after 15min inactivity

## Alternative: Use a Headless Browser Service
If you don't want to manage infrastructure:

1. **Browserless.io**: https://browserless.io
   - $49/month for 10,000 requests
   - Managed Chromium in the cloud

2. **Apify**: https://apify.com
   - $49/month starter plan
   - Built for web scraping

Update `src/lib/services/mcpClient.ts` to use their API instead of your own MCP server.

## Need Help?
Check the full deployment guide: `PRODUCTION-DEPLOYMENT.md`
