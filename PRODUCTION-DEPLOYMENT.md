# Production Deployment Guide - ClientFlow

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Systeme.io    │────────▶│  Vercel (Main)   │────────▶│  Railway/VPS    │
│   (Webhooks)    │         │  - SvelteKit App │         │  - MCP Server   │
└─────────────────┘         │  - API Routes    │         │  - Playwright   │
                            │  - Database      │         │  - Chromium     │
                            └──────────────────┘         └─────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │ Prisma Postgres  │
                            │  (Vercel)        │
                            └──────────────────┘
```

## Components

### 1. Vercel (Main Application)
**What runs here:**
- ✅ SvelteKit frontend
- ✅ API routes
- ✅ Incoming webhooks from Systeme.io
- ✅ Database operations (Prisma + Postgres)

**Limitations:**
- ❌ Cannot run Playwright (no browser binaries)
- ❌ Cannot run long-running processes
- ❌ 10-second timeout for serverless functions

**Deployed at:** `https://trendstec-clientflow.vercel.app`

---

### 2. Railway/VPS (MCP Server)
**What runs here:**
- ✅ Playwright with Chromium
- ✅ MT5 web scraping
- ✅ HTTP API wrapper for remote calls
- ✅ Long-running browser sessions

**Why separate:**
- Playwright requires full browser binaries (200MB+)
- Scraping can take 30+ seconds
- Needs persistent browser sessions

---

## Deployment Steps

### Part 1: Vercel (Main App) - Already Deployed! ✅

Your main app is already running on Vercel with:
- ✅ Webhook endpoint: `/api/webhooks/systeme`
- ✅ Database: Prisma Postgres
- ✅ Environment variables configured
- ✅ Logo on landing page

**Current Environment Variables:**
```bash
DATABASE_URL=<prisma-postgres-url>
POSTGRES_URL=<postgres-url>
JWT_SECRET=<your-jwt-secret>
ENCRYPTION_KEY=<your-encryption-key>
SYSTEME_WEBHOOK_SECRET=<webhook-secret>
PUBLIC_APP_URL=https://trendstec-clientflow.vercel.app
APP_URL=https://trendstec-clientflow.vercel.app
```

**Still need to add:**
```bash
SYSTEME_API_KEY=<your-systeme-api-key>        # For outgoing API calls
MCP_SERVER_URL=<railway-url-or-vps-ip>        # URL of MCP server
MCP_API_KEY=<optional-security-key>            # Optional API key for MCP
```

---

### Part 2: Railway (MCP Server) - New Deployment

#### Option A: Railway (Recommended - Easiest)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Create New Project:**
   ```bash
   cd /Users/dmd/my-svelte-app
   railway init
   ```

3. **Add Dockerfile:**
   The `Dockerfile.mcp` is already created. Just rename it:
   ```bash
   cp Dockerfile.mcp mcp-servers/mt5-playwright/Dockerfile
   ```

4. **Update MCP package.json:**
   ```bash
   cd mcp-servers/mt5-playwright
   npm install express
   ```

   Add to package.json scripts:
   ```json
   {
     "scripts": {
       "start:http": "node dist/http-server.js"
     }
   }
   ```

5. **Deploy to Railway:**
   ```bash
   railway up
   railway domain  # Get your public URL
   ```

6. **Set Environment Variables in Railway:**
   ```bash
   railway variables set PORT=3001
   ```

7. **Get Your MCP Server URL:**
   ```bash
   railway domain
   # Copy the URL (e.g., https://your-app.railway.app)
   ```

8. **Add MCP_SERVER_URL to Vercel:**
   ```bash
   vercel env add MCP_SERVER_URL
   # Paste: https://your-app.railway.app
   # Select: Production, Preview, Development

   vercel --prod  # Redeploy
   ```

#### Option B: DigitalOcean/VPS

1. **Create Droplet:**
   - Ubuntu 22.04 LTS
   - Minimum 2GB RAM
   - $12/month tier recommended

2. **SSH into server:**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Dependencies:**
   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Node.js 22
   curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
   apt install -y nodejs

   # Install Playwright dependencies
   npx playwright install-deps chromium
   ```

4. **Upload MCP Server:**
   ```bash
   # From your local machine
   scp -r mcp-servers/mt5-playwright root@your-server-ip:/root/
   ```

5. **On Server - Install & Run:**
   ```bash
   cd /root/mt5-playwright
   npm install
   npm run build

   # Install PM2 for process management
   npm install -g pm2

   # Start with PM2
   pm2 start dist/http-server.js --name mcp-server
   pm2 save
   pm2 startup
   ```

6. **Configure Firewall:**
   ```bash
   ufw allow 3001/tcp
   ufw enable
   ```

7. **Add to Vercel:**
   ```bash
   vercel env add MCP_SERVER_URL
   # Paste: http://your-server-ip:3001
   # Select: Production, Preview, Development

   vercel --prod
   ```

---

## Testing the Setup

### 1. Test MCP Server Health:
```bash
curl https://your-mcp-server.railway.app/health
# or
curl http://your-server-ip:3001/health

# Should return:
# {"status":"ok","browser":"not initialized","loggedIn":false,"timestamp":"..."}
```

### 2. Test MT5 Scraping from Vercel:
Go to: `https://trendstec-clientflow.vercel.app/dashboard/integrations`
- Add Systeme.io API key
- Test connection

### 3. Test Complete Flow:
1. Create test lead in Systeme.io
2. Webhook triggers → Vercel saves lead to database
3. Manually trigger scraping → Vercel calls MCP server → MT5 data scraped
4. MT5 data syncs back to Systeme.io via API

---

## Environment Variables Summary

### Vercel:
```bash
# Database (Already set)
DATABASE_URL=<prisma-postgres>
POSTGRES_URL=<postgres>

# Auth (Already set)
JWT_SECRET=<secret>
ENCRYPTION_KEY=<32-char-key>

# Systeme.io
SYSTEME_WEBHOOK_SECRET=<webhook-secret>   # Already set
SYSTEME_API_KEY=<api-key>                 # ⚠️ NEED TO ADD

# MCP Server
MCP_SERVER_URL=<railway-or-vps-url>       # ⚠️ NEED TO ADD
MCP_API_KEY=<optional-key>                # ⚠️ OPTIONAL

# URLs (Already set)
PUBLIC_APP_URL=https://trendstec-clientflow.vercel.app
APP_URL=https://trendstec-clientflow.vercel.app
```

### Railway/VPS:
```bash
PORT=3001
NODE_ENV=production
MCP_API_KEY=<optional-same-as-vercel>  # Optional security
```

---

## Monitoring & Maintenance

### Railway:
```bash
railway logs          # View logs
railway status        # Check health
railway restart       # Restart service
```

### VPS:
```bash
pm2 logs mcp-server   # View logs
pm2 status            # Check status
pm2 restart mcp-server  # Restart
```

---

## Cost Estimate

| Service | Plan | Cost/Month |
|---------|------|------------|
| Vercel | Hobby | $0 (or $20 Pro) |
| Prisma Postgres | Free tier | $0 |
| Railway | Hobby | ~$5-10 |
| **OR** DigitalOcean VPS | Basic | $12 |

**Total: $5-20/month** depending on traffic

---

## Troubleshooting

### MCP Server won't start:
```bash
# Check logs
railway logs
# or
pm2 logs mcp-server

# Common issues:
# - Missing Playwright dependencies
# - Port already in use
# - Insufficient memory
```

### Vercel can't reach MCP:
```bash
# Test from command line:
curl https://your-mcp-url/health

# Check:
# - Firewall rules (VPS)
# - Railway domain active
# - MCP_SERVER_URL in Vercel env vars
```

### Scraping fails:
```bash
# Check MCP logs for errors
# Common issues:
# - MT5 website changed structure
# - Login credentials invalid
# - Anti-bot detection triggered
# - Session timeout
```

---

## Next Steps

1. ✅ Vercel is deployed and working
2. ⚠️ Deploy MCP server to Railway or VPS
3. ⚠️ Add `SYSTEME_API_KEY` to Vercel
4. ⚠️ Add `MCP_SERVER_URL` to Vercel
5. ⚠️ Test complete scraping workflow
6. ⚠️ Monitor logs and adjust

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Playwright Docs**: https://playwright.dev
- **SpecKit Testing**: See `.specify/SETUP-COMPLETE.md`
