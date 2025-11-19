# Meta Marketing API - Complete Setup Guide

## ✅ Implementation Status

Your ClientFlow application has been updated with full Meta Marketing API integration for campaign management.

---

## 🔐 1. Meta App Configuration

### App Credentials (Update in `.env`)

```bash
# Meta Marketing API Credentials
FACEBOOK_APP_ID="your_app_id_here"
FACEBOOK_APP_SECRET="your_app_secret_here"

# Public URL for OAuth redirects
PUBLIC_BASE_URL="https://trendstec-clientflow.vercel.app"
```

### Required Permissions (Already Configured)

The OAuth flow now requests these permissions:

✅ **ads_management** - Create and manage ads, campaigns, ad sets, and ad accounts  
✅ **ads_read** - Read ad account insights and campaigns  
✅ **business_management** - Access Business Manager and ad accounts  
✅ **pages_read_engagement** - Read page data for ad creatives  
✅ **pages_show_list** - List pages user manages  
✅ **public_profile** - Basic profile information  
✅ **email** - User email address  

---

## 🔄 2. Authentication Flow (Implemented)

### Step A: User Access Token (Short-Lived)

**Endpoint:** `/api/facebook/auth`

```typescript
// User clicks "Connect Facebook" button
// System redirects to Meta OAuth dialog with all required permissions
// User approves access
// Meta redirects to callback with authorization code
```

### Step B: Exchange for Long-Lived Token (60 Days)

**Endpoint:** `/api/facebook/callback`

```typescript
// Automatically exchanges short-lived token
await FacebookAPI.exchangeForLongLivedToken(shortLivedToken);
// Returns: { access_token: string, expires_in: 5184000 } // 60 days
```

### Step C: System User Token (Recommended)

For server-side ad management, create a system user:

1. Go to **Business Settings** → **Users** → **System Users**
2. Click **Add** → Create system user
3. Assign permissions:
   - ✅ Manage ad accounts
   - ✅ Manage campaigns
4. Generate access token with scopes:
   - `ads_management`
   - `business_management`
5. Use this token for all server-side API calls

---

## 📡 3. Marketing API Endpoints (Implemented)

### A. Get User's Ad Accounts

```typescript
// Method 1: Direct user ad accounts
GET /me/adaccounts

// Method 2: Business-owned ad accounts
GET /<business_id>/owned_ad_accounts

// Implementation:
const accounts = await FacebookAPI.getAdAccounts(accessToken, businessId);
```

**Response:**
```json
{
  "data": [
    {
      "id": "act_123456789",
      "name": "My Ad Account",
      "account_status": 1,
      "currency": "USD",
      "timezone_name": "America/New_York"
    }
  ]
}
```

### B. Create Campaign

```typescript
POST /act_<ad_account_id>/campaigns

// Implementation:
const campaign = await FacebookAPI.createCampaign(
  'act_123456789',
  accessToken,
  {
    name: 'Forex Webinar Q4 2025',
    objective: 'LEAD_GENERATION',
    status: 'PAUSED',
    special_ad_categories: []
  }
);
```

**Campaign Objectives:**
- `LEAD_GENERATION` - Lead capture forms
- `CONVERSIONS` - Drive actions on website
- `LINK_CLICKS` - Drive traffic
- `REACH` - Maximize reach
- `BRAND_AWARENESS` - Build awareness

### C. Create Ad Set

```typescript
POST /act_<ad_account_id>/adsets

// Implementation:
const adSet = await FacebookAPI.createAdSet(
  'act_123456789',
  accessToken,
  {
    name: 'Forex Traders 25-50',
    campaign_id: '120202345678901234',
    daily_budget: 4000, // $40 in cents
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'LEAD_GENERATION',
    targeting: {
      age_min: 25,
      age_max: 50,
      genders: [1, 2],
      geo_locations: {
        countries: ['US', 'CA']
      },
      interests: [
        { id: '6003107902433', name: 'Trading' },
        { id: '6003139266461', name: 'Investing' }
      ]
    },
    status: 'PAUSED'
  }
);
```

### D. Create Ad Creative

```typescript
POST /act_<ad_account_id>/adcreatives

// Implementation:
const creative = await FacebookAPI.createAdCreative(
  'act_123456789',
  accessToken,
  {
    name: 'Webinar Registration Creative',
    object_story_spec: {
      page_id: '987654321',
      link_data: {
        image_url: 'https://yourdomain.com/ad-image.jpg',
        link: 'https://yourdomain.com/webinar',
        message: 'Join our FREE Forex Trading Webinar!',
        call_to_action: {
          type: 'SIGN_UP',
          value: {
            link: 'https://yourdomain.com/webinar'
          }
        }
      }
    }
  }
);
```

### E. Create Ad

```typescript
POST /act_<ad_account_id>/ads

// Implementation:
const ad = await FacebookAPI.createAd(
  'act_123456789',
  accessToken,
  {
    name: 'Webinar Ad - Desktop',
    adset_id: '120202345678901234',
    creative: {
      creative_id: '120202345678901235'
    },
    status: 'PAUSED'
  }
);
```

### F. Get Ad Insights

```typescript
GET /act_<ad_account_id>/insights

// Implementation:
const insights = await FacebookAPI.getAdAccountInsights(
  'act_123456789',
  accessToken,
  {
    date_preset: 'last_7d',
    level: 'campaign',
    fields: 'spend,impressions,clicks,ctr,cpc,cpm,actions'
  }
);
```

---

## 🔧 4. Updated Code Files

### ✅ `/src/lib/server/facebook-api.ts`

**New Methods Added:**
- `exchangeForLongLivedToken()` - Step B of OAuth flow
- `createCampaign()` - Create campaigns
- `createAdSet()` - Create ad sets
- `getAdSets()` - List ad sets
- `createAdCreative()` - Create ad creatives
- `getAdCreatives()` - List ad creatives
- `createAd()` - Create ads
- `getAds()` - List ads
- `updateCampaignStatus()` - Pause/resume campaigns
- `getBusinesses()` - List user businesses
- `debugToken()` - Verify token permissions

### ✅ `/src/routes/api/facebook/auth/+server.ts`

**Updated:**
- Now requests all 7 required permissions
- Added `auth_type=rerequest` to force permission dialog

### ✅ `/src/routes/api/facebook/callback/+server.ts`

**Already Implements:**
- Token exchange (short → long-lived)
- Ad account detection
- Multi-tier setup detection

---

## 🧪 5. Testing & Verification

### Test OAuth Flow

```bash
# 1. Start local server
npm run dev

# 2. Navigate to
http://localhost:5173/dashboard/ads

# 3. Click "Connect Facebook"
# 4. Approve all permissions
# 5. Verify redirect to dashboard with success message
```

### Test Token Exchange

```typescript
// Check token in database
const account = await prisma.facebookAdAccount.findFirst({
  where: { userId: 'your_user_id' }
});

console.log('Token expires:', account.tokenExpiresAt);
// Should be ~60 days in future
```

### Test API Endpoints

```typescript
// 1. Get ad accounts
const accounts = await FacebookAPI.getAdAccounts(accessToken);
console.log('Ad Accounts:', accounts);

// 2. Get campaigns
const campaigns = await FacebookAPI.getCampaigns('act_123456789', accessToken);
console.log('Campaigns:', campaigns);

// 3. Test token permissions
const debug = await FacebookAPI.debugToken(accessToken);
console.log('Permissions:', debug.data.scopes);
```

---

## 📋 6. Deployment Checklist

### Vercel Environment Variables

```bash
# Add to Vercel production
vercel env add FACEBOOK_APP_ID production
vercel env add FACEBOOK_APP_SECRET production
vercel env add PUBLIC_BASE_URL production

# Redeploy
vercel --prod
```

### Meta App Settings

1. **App Dashboard** → **Settings** → **Basic**
   - ✅ App ID matches `.env`
   - ✅ App Secret matches `.env`
   - ✅ App is in Live mode (not Development)

2. **App Dashboard** → **Use Cases** → **Customize**
   - ✅ "Create and manage ads with the Marketing API" enabled
   - ✅ Required permissions approved

3. **App Dashboard** → **Settings** → **Advanced**
   - ✅ OAuth redirect URIs:
     - `https://trendstec-clientflow.vercel.app/api/facebook/callback`
     - `http://localhost:5173/api/facebook/callback` (for testing)

---

## 🚨 7. Common Issues & Solutions

### Issue: "Insufficient Permissions"

**Solution:** User must re-authenticate:
```typescript
// Force re-authentication with new permissions
const authUrl = '/api/facebook/auth'; // Will request all permissions
```

### Issue: "Invalid OAuth Redirect URI"

**Solution:** Add redirect URL to Meta App Settings:
1. Go to App Settings → Basic
2. Add: `https://trendstec-clientflow.vercel.app/api/facebook/callback`

### Issue: "App Not Configured for Marketing API"

**Solution:** 
1. Go to App Dashboard → Use Cases
2. Click "Customize" on "Create and manage ads with the Marketing API"
3. Request required permissions
4. Submit for app review if needed

### Issue: "Token Expired"

**Solution:** Tokens expire after 60 days. Implement refresh:
```typescript
// Check token expiration
if (account.tokenExpiresAt < new Date()) {
  // Redirect user to re-authenticate
  throw redirect(302, '/api/facebook/auth');
}
```

---

## 📊 8. Usage Examples

### Complete Campaign Creation Flow

```typescript
// 1. Get user's ad account
const accounts = await FacebookAPI.getAdAccounts(accessToken);
const adAccountId = accounts.data[0].id;

// 2. Create campaign
const campaign = await FacebookAPI.createCampaign(adAccountId, accessToken, {
  name: 'Forex Webinar Campaign',
  objective: 'LEAD_GENERATION',
  status: 'PAUSED'
});

// 3. Create ad set
const adSet = await FacebookAPI.createAdSet(adAccountId, accessToken, {
  name: 'US Traders 25-50',
  campaign_id: campaign.id,
  daily_budget: 4000,
  billing_event: 'IMPRESSIONS',
  optimization_goal: 'LEAD_GENERATION',
  targeting: {
    age_min: 25,
    age_max: 50,
    genders: [1, 2],
    geo_locations: { countries: ['US'] }
  },
  status: 'PAUSED'
});

// 4. Create ad creative
const creative = await FacebookAPI.createAdCreative(adAccountId, accessToken, {
  name: 'Webinar Image',
  object_story_spec: {
    page_id: 'your_page_id',
    link_data: {
      link: 'https://yourdomain.com/webinar',
      message: 'Join our FREE webinar!'
    }
  }
});

// 5. Create ad
const ad = await FacebookAPI.createAd(adAccountId, accessToken, {
  name: 'Webinar Ad 1',
  adset_id: adSet.id,
  creative: { creative_id: creative.id },
  status: 'PAUSED'
});

// 6. Activate campaign
await FacebookAPI.updateCampaignStatus(campaign.id, accessToken, 'ACTIVE');
```

---

## ✅ Summary

Your ClientFlow app now has **full Meta Marketing API integration** with:

✅ Proper OAuth flow with all 7 required permissions  
✅ Long-lived token exchange (60-day tokens)  
✅ Complete campaign creation API (campaigns, ad sets, creatives, ads)  
✅ Ad account management  
✅ Performance insights  
✅ Token debugging and validation  

**Next Steps:**
1. Update `.env` with your Meta App credentials
2. Deploy to Vercel with environment variables
3. Test OAuth flow in dashboard
4. Create your first campaign!

---

## 📞 Support

- **Meta Marketing API Docs:** https://developers.facebook.com/docs/marketing-apis
- **Graph API Explorer:** https://developers.facebook.com/tools/explorer
- **Business Manager:** https://business.facebook.com

