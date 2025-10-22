# Systeme.io Credentials Setup Guide

## Overview
ClientFlow needs Systeme.io credentials for two different purposes:
1. **API Operations** - Creating tags, custom fields, and webhooks automatically
2. **Playwright Automation** - Creating workflows (not supported by API)

## Where to Add Credentials

### Local Development (.env file)

Add these credentials to your `.env` file:

```bash
# Systeme.io API Key (for tag/field/webhook management)
SYSTEME_API_KEY="your-systeme-api-key-here"

# Systeme.io Login Credentials (for Playwright workflow automation)
SYSTEME_EMAIL="your-systeme-email@example.com"
SYSTEME_PASSWORD="your-systeme-password-here"
```

### Production (Vercel Environment Variables)

Add these same variables to your Vercel project:

1. Go to https://vercel.com/myles-projects-dd515697/my-svelte-app/settings/environment-variables
2. Add the following environment variables:
   - `SYSTEME_API_KEY` → Your Systeme.io API key
   - `SYSTEME_EMAIL` → Your Systeme.io login email
   - `SYSTEME_PASSWORD` → Your Systeme.io password

## How to Get Your Systeme.io API Key

1. Log in to https://systeme.io
2. Go to **Settings** → **API**
3. Copy your API key
4. Paste it into `SYSTEME_API_KEY` in both `.env` and Vercel

## What Each Credential is Used For

### SYSTEME_API_KEY
**Used by:**
- `/api/systeme/auto-setup` - Creates tags, custom fields, and webhooks
- `systemeService.ts` - All API operations (create/update/delete tags, fields, webhooks)
- Tag syncing from MT5 scraper

**Example usage:**
```bash
curl -X POST http://localhost:5173/api/systeme/auto-setup
```

### SYSTEME_EMAIL & SYSTEME_PASSWORD
**Used by:**
- `scripts/setup-systeme-workflows.ts` - Playwright automation for workflow creation
- Runs in headless browser to automate workflow setup

**Example usage:**
```bash
npm run setup:systeme-workflows
```

## Testing Your Setup

### Test API Key
```bash
# Check if API key is configured
curl http://localhost:5173/api/systeme/auto-setup

# Should return current status of tags, fields, and webhooks
```

### Test Playwright Credentials
```bash
# Run the workflow automation script
npm run setup:systeme-workflows

# Browser will open and log into Systeme.io automatically
# If credentials are wrong, you'll see login error
```

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to Git (it's in `.gitignore`)
- Keep your API key and password secure
- The `.env` file should only exist locally
- Production uses Vercel environment variables

## Troubleshooting

### "SYSTEME_API_KEY not set" error
- Check `.env` file has `SYSTEME_API_KEY="..."`
- Restart dev server: `npm run dev`
- For production, check Vercel environment variables

### "Missing required environment variables: SYSTEME_EMAIL and SYSTEME_PASSWORD"
- Check `.env` file has both `SYSTEME_EMAIL` and `SYSTEME_PASSWORD`
- These are only needed for Playwright automation, not API operations
- Make sure there are no typos in the variable names

### Playwright login fails
- Verify credentials are correct by logging in manually at https://systeme.io/login
- Check if Systeme.io changed their login page selectors
- Browser may be blocked - try running with `headless: false` to see what's happening

## Next Steps

After adding credentials:

1. **Test API Setup:**
   ```bash
   npm run dev
   # Visit http://localhost:5173/dashboard/admin/systeme-setup
   # Click "Run Auto-Setup"
   ```

2. **Test Playwright Automation:**
   ```bash
   npm run setup:systeme-workflows
   # Browser will open and create workflows
   ```

3. **Deploy to Production:**
   ```bash
   git push
   # Or use: vercel --prod
   ```

## Current Status

✅ Local environment configured
✅ Navy background removed from setup page
✅ Credentials section added to `.env`
⏳ **Action Required:** Add your actual Systeme.io credentials

**Files Updated:**
- `.env` - Added SYSTEME_API_KEY, SYSTEME_EMAIL, SYSTEME_PASSWORD placeholders
- `src/routes/dashboard/admin/systeme-setup/+page.svelte` - Removed navy background
