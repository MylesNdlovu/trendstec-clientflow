# Facebook Ads Manager - Setup Guide

This guide will help you set up the Facebook Ads integration for beginner-friendly campaign management.

## Prerequisites

1. A Facebook account
2. Your application running locally or deployed

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Click **"Create App"**
3. Choose **"Business"** as the app type
4. Fill in:
   - **App Name**: "Your Company Ads Manager" (or similar)
   - **App Contact Email**: Your email
   - **Business Account**: Select or create one

5. Once created, go to **Settings > Basic**
6. Copy your **App ID** and **App Secret**

## Step 2: Configure OAuth Settings

1. In your Facebook App dashboard, go to **Products**
2. Add **"Facebook Login"** product
3. Go to **Facebook Login > Settings**
4. Under **Valid OAuth Redirect URIs**, add:
   ```
   http://localhost:5173/api/facebook/callback
   https://yourdomain.com/api/facebook/callback
   ```

## Step 3: Add Required Permissions

1. Go to **App Review > Permissions and Features**
2. Request the following permissions:
   - `pages_show_list` - See list of Pages
   - `pages_read_engagement` - Read Page data
   - `pages_manage_ads` - Manage Page ads
   - `business_management` - Manage Business accounts
   - `ads_management` - Create and manage ads
   - `ads_read` - Read ad insights

**Note**: Some permissions require app review by Facebook. For testing, use your own account.

## Step 4: Environment Configuration

1. Open your `.env` file
2. Update the Facebook configuration:

```bash
# Facebook App Configuration
FACEBOOK_APP_ID="your_app_id_here"
FACEBOOK_APP_SECRET="your_app_secret_here"
PUBLIC_BASE_URL="http://localhost:5173"  # Change to your production URL when deploying
```

3. Save the file
4. Restart your dev server:
   ```bash
   npm run dev
   ```

## Step 5: Test the Connection

1. Login to your application
2. Navigate to **Dashboard > Ads**
3. Click **"Connect with Facebook"**
4. Authorize the app
5. You'll be redirected back to the Ads page

## How It Works

### Connection Modes

**Beginner Mode (Recommended)**
- One-click OAuth connection
- Automatic permission handling
- Guided setup for first-time users
- Our platform detects your setup tier:
  - **Tier 0**: No Facebook Page
  - **Tier 1**: Has Page (can boost posts)
  - **Tier 2**: Has Business Manager
  - **Tier 3**: Full setup with Ad Account (can create campaigns)

**Advanced Mode**
- Manual System User token entry
- For users who already have tokens
- Direct access to all features

### Setup Flow for Beginners

If user doesn't have a complete Facebook Ads setup, we guide them through:

1. **Create Facebook Page**
   - User creates via [facebook.com/pages/create](https://facebook.com/pages/create)
   - Represents their business (e.g., "Joe's Pizza")

2. **Create Business Manager**
   - User creates via [business.facebook.com](https://business.facebook.com)
   - Professional tool for managing ads

3. **Create Ad Account**
   - User adds payment method
   - Creates ad account in Business Manager
   - Ready to run campaigns!

After each step, user clicks **"I've Completed These Steps"** and we re-check their status.

## API Endpoints

### OAuth Flow
- `GET /api/facebook/auth` - Initiates OAuth
- `GET /api/facebook/callback` - OAuth callback handler

### Account Management
- `GET /api/facebook/account` - Get current account status
- `POST /api/facebook/connect-token` - Manual token connection (advanced)
- `GET /api/facebook/auto-setup` - Check setup status and next steps

### Campaign Management
- `GET /api/facebook/campaigns` - List campaigns
- `POST /api/facebook/campaigns` - Create campaign
- `GET /api/facebook/stats` - Ad spend statistics
- `GET /api/facebook/templates` - Pre-made campaign templates

## Database Schema

The integration uses these Prisma models:

```prisma
model FacebookAdAccount {
  id              String    @id @default(cuid())
  userId          String
  setupTier       Int       @default(0)  // 0-3 (none to full)
  pageId          String?
  pageName        String?
  businessId      String?
  businessName    String?
  adAccountId     String?   @unique
  adAccountName   String?
  accessToken     String?   // Encrypted
  isConnected     Boolean   @default(false)
  canBoostPosts   Boolean   @default(false)
  canCreateCampaigns Boolean @default(false)
}
```

## Security

- All access tokens are **encrypted** using the `ENCRYPTION_KEY` from `.env`
- OAuth uses **state parameter** to prevent CSRF attacks
- Long-lived tokens are automatically obtained (60 days validity)
- Tokens are stored per-user for multi-tenant isolation

## Troubleshooting

### "Invalid OAuth redirect URI"
- Ensure redirect URIs are added in Facebook App settings
- Check `PUBLIC_BASE_URL` matches your actual URL

### "Permission denied"
- Request required permissions in App Review
- For testing, use your own Facebook account

### "Token expired"
- We automatically exchange for long-lived tokens
- Users need to reconnect every 60 days

### "Setup tier not updating"
- User must complete steps in Facebook first
- Click "Check My Setup" after completing steps
- May take a few minutes for Facebook API to reflect changes

## Production Deployment

Before deploying to production:

1. Update `PUBLIC_BASE_URL` in `.env`:
   ```bash
   PUBLIC_BASE_URL="https://yourdomain.com"
   ```

2. Add production callback URL in Facebook App settings:
   ```
   https://yourdomain.com/api/facebook/callback
   ```

3. Submit app for review to get permissions approved

4. Consider upgrading to System User tokens for production:
   - Non-expiring tokens
   - Better for server-to-server communication
   - See Advanced Mode in the UI

## Support

For issues or questions:
- Check Facebook's [Marketing API documentation](https://developers.facebook.com/docs/marketing-apis)
- Review logs in browser console and server logs
- Ensure all environment variables are set correctly
