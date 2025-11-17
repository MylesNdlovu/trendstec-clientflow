# Render MCP Server Deployment Guide

## ⚡ Quick Deploy - Manual Trigger

Since Render hasn't auto-deployed the Docker image fix yet, you need to manually trigger a deployment:

### Option 1: Render Dashboard (Recommended - 2 minutes)

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Login with your account

2. **Find Your MCP Service:**
   - Look for service: `trendstec-mcp-server`
   - Or search for it in the dashboard

3. **Trigger Manual Deploy:**
   - Click on the service name
   - Click **"Manual Deploy"** button (top right)
   - Select **"Deploy latest commit"**
   - Confirm the deployment

4. **Wait for Build (5-10 minutes):**
   - Watch the deploy logs
   - You'll see: "Pulling mcr.microsoft.com/playwright:v1.55.1-jammy"
   - Build will install Chromium browsers
   - Status will change to "Live" when done

5. **Verify Deployment:**
   ```bash
   curl -X POST https://trendstec-mcp-server.onrender.com/browser/init
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Browser initialized"
   }
   ```

---

### Option 2: Enable Auto-Deploy (One-time setup)

1. Go to Service Settings in Render Dashboard
2. Find **"Auto-Deploy"** section
3. Enable: **"Yes"** for `main` branch
4. Save settings

**From now on:** Every git push to main will auto-deploy

---

## 🎯 What Was Fixed

### Commits Deployed:
1. **522fee8** - Fix MCP server: Update Playwright Docker image to v1.55.1
2. **c8d692c** - Enable MCP client integration for MT5 API endpoints

### Changes:
- ✅ Updated Docker image from v1.48.0 → v1.55.1
- ✅ Enabled real MCP client in `/api/mt5/refresh`
- ✅ Enabled real MCP client in `/api/mt5/stats`
- ✅ Deployed to Vercel production

---

## ✅ Testing After Render Deploys

### 1. Test MCP Server Health
```bash
curl https://trendstec-mcp-server.onrender.com/health
```

Expected:
```json
{
  "status": "ok",
  "browser": "not initialized",
  "loggedIn": false
}
```

### 2. Test Browser Initialization
```bash
curl -X POST https://trendstec-mcp-server.onrender.com/browser/init \
  -H "Content-Type: application/json"
```

Expected:
```json
{
  "success": true,
  "message": "Browser initialized"
}
```

### 3. Test MT5 Login (with your credentials)
```bash
curl -X POST https://trendstec-mcp-server.onrender.com/mt5/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "YOUR_MT5_LOGIN",
    "password": "YOUR_MT5_PASSWORD",
    "server": "YOUR_SERVER",
    "brokerUrl": "https://YOUR_BROKER_MT5_WEB_URL"
  }'
```

### 4. Test Vercel Integration
```bash
# Test from Vercel (will call MCP server)
curl -X POST https://my-svelte-3yq1mc6xo-myles-projects-dd515697.vercel.app/api/mt5/refresh
```

---

## 📋 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| GitHub | ✅ Updated | Both commits pushed |
| Render | ⏳ **NEEDS MANUAL DEPLOY** | Still on old Docker image |
| Vercel | ✅ Deployed | MCP integration enabled |
| MCP Client | ✅ Ready | Will work when Render deploys |

---

## 🚨 If You See Errors After Deploy

### Error: "Not logged in. Call /mt5/login first"

**Solution:** You need to login to MT5 before fetching account data:

```bash
# 1. Initialize browser
curl -X POST https://trendstec-mcp-server.onrender.com/browser/init

# 2. Login to MT5
curl -X POST https://trendstec-mcp-server.onrender.com/mt5/login \
  -H "Content-Type: application/json" \
  -d '{"username":"...","password":"...","server":"...","brokerUrl":"..."}'

# 3. Get account data
curl -X POST https://trendstec-mcp-server.onrender.com/mt5/account-data
```

### Error: "MCP server unavailable"

**Solution:** Check if Render service is running:
- Visit Render Dashboard
- Check service status
- Look at recent deploy logs

---

## 🎉 When Everything Works

You'll have:
- ✅ Playwright browsers running on Render
- ✅ MT5 web scraping via MCP server
- ✅ Real-time account data in your Vercel app
- ✅ Automated lead tracking with trading volume

---

## 📞 Need Help?

- Check Render deploy logs for errors
- MCP Server URL: https://trendstec-mcp-server.onrender.com
- Vercel App URL: https://my-svelte-3yq1mc6xo-myles-projects-dd515697.vercel.app
