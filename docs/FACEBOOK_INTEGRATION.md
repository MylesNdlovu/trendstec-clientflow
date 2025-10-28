# Facebook Integration Documentation

> Complete guide to Facebook OAuth and Ads API integration

## 🔄 OAuth Flow

### Overview
TrendsTec ClientFlow uses Facebook OAuth 2.0 to connect user Facebook accounts and access their Pages, Business Manager, and Ad Accounts.

### OAuth Sequence

```
User clicks "Connect with Facebook"
    ↓
Redirect to /api/facebook/auth
    ↓
Redirect to Facebook OAuth (with state=userId)
    ↓
User authorizes app on Facebook
    ↓
Facebook redirects to /api/facebook/callback?code=...&state=userId
    ↓
Exchange code for access token
    ↓
Exchange for long-lived token (60 days)
    ↓
Detect Facebook setup (Tier 0-3)
    ↓
Save FacebookAdAccount to database
    ↓
Redirect to dashboard with success/tier info
```

---

## 🎯 Setup Tiers

The system automatically detects what Facebook assets the user has access to:

### Tier 0: Basic Profile Only
**Permissions**: `public_profile`

**User Has**:
- Basic profile (name, profile picture)

**User Cannot**:
- View Pages
- Access Business Manager
- Run ads

**UI Behavior**:
- Show "Additional Permissions Needed" warning
- Explain Facebook app review process
- Guide user to create Page/Business Manager while waiting
- Show "Reconnect" button for when permissions are approved

---

### Tier 1: Has Facebook Page
**Permissions**: `public_profile`, `pages_show_list`

**User Has**:
- One or more Facebook Pages
- Page access token

**User Can**:
- Boost posts (basic promotion)

**User Cannot**:
- Create advanced campaigns
- Access Business Manager features

**UI Behavior**:
- Show "Basic Connected" status
- Suggest upgrading to Business Manager
- Enable post boosting features

**API Calls**:
```javascript
GET https://graph.facebook.com/v19.0/me/accounts
  ?access_token={token}
  &fields=id,name,access_token
```

---

### Tier 2: Has Business Manager
**Permissions**: `public_profile`, `pages_show_list`, `business_management`

**User Has**:
- Facebook Page(s)
- Business Manager account

**User Cannot**:
- Create ad campaigns (no Ad Account yet)

**UI Behavior**:
- Show "Almost There" status
- Guide user to create Ad Account
- Provide link to Business Manager settings

**API Calls**:
```javascript
GET https://graph.facebook.com/v19.0/me/businesses
  ?access_token={token}
  &fields=id,name
```

---

### Tier 3: Full Access (Ad Account Ready)
**Permissions**: `public_profile`, `pages_show_list`, `business_management`, `ads_management`

**User Has**:
- Facebook Page(s)
- Business Manager
- Ad Account with payment method

**User Can**:
- Create advanced campaigns
- Manage targeting
- Access full Ads API

**UI Behavior**:
- Show "All Set!" success message
- Enable full campaign creation
- Show ad templates library

**API Calls**:
```javascript
GET https://graph.facebook.com/v19.0/{business_id}/adaccounts
  ?access_token={token}
  &fields=id,name,account_status,currency,timezone_name
```

---

## 🔑 Permissions

### Current Permissions
| Permission | Purpose | Required For |
|------------|---------|--------------|
| `public_profile` | Basic user info | All tiers (always granted) |
| `pages_show_list` | Access user's Pages | Tier 1+ |
| `business_management` | Access Business Manager | Tier 2+ |
| `ads_management` | Create/manage ads | Tier 3 |

### Permission Status

**Development Mode** (Current):
- Only `public_profile` works without app review
- All other permissions require Facebook App Review approval

**After App Review Approval**:
- Users will be able to grant all permissions
- Reconnect flow will upgrade users to appropriate tier

---

## 🔐 Token Management

### Access Token Types

**Short-Lived Token** (Initial):
- Expires in ~2 hours
- Received from OAuth callback
- Immediately exchanged for long-lived token

**Long-Lived Token**:
- Expires in 60 days
- Stored encrypted in database
- Used for all API calls

**Exchange Process**:
```javascript
GET https://graph.facebook.com/v19.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={app_id}
  &client_secret={app_secret}
  &fb_exchange_token={short_lived_token}
```

### Token Storage

**Encryption**:
- Tokens encrypted using AES-256-GCM
- Encryption key from `ENCRYPTION_KEY` environment variable
- Stored as JSON: `{"encrypted":"...","iv":"...","tag":"..."}`

**Database Fields**:
- `FacebookAdAccount.accessToken` - User's long-lived token
- `FacebookAdAccount.pageAccessToken` - Page-specific token
- `FacebookAdAccount.tokenExpiresAt` - Expiration timestamp

---

## 📡 API Calls

### Graph API Version
Currently using: **v19.0**

### Base URL
```
https://graph.facebook.com/v19.0
```

### Common Endpoints

**Get User's Pages**:
```
GET /me/accounts
  ?access_token={token}
  &fields=id,name,access_token
```

**Get User's Businesses**:
```
GET /me/businesses
  ?access_token={token}
  &fields=id,name
```

**Get Ad Accounts**:
```
GET /{business_id}/adaccounts
  ?access_token={token}
  &fields=id,name,account_status,currency,timezone_name
```

**Create Campaign** (Tier 3):
```
POST /{ad_account_id}/campaigns
  ?access_token={token}
  &name={campaign_name}
  &objective=LEAD_GENERATION
  &status=PAUSED
  &special_ad_categories=[]
```

---

## ⚠️ Error Handling

### OAuth Errors

**Access Denied**:
```
?error=access_denied
```
User clicked "Cancel" on Facebook auth screen.

**Invalid Callback**:
```
?error=invalid_callback
```
Missing `code` or `state` parameter.

**Token Exchange Failed**:
```
?error=token_exchange_failed&details=...
```
Facebook rejected the authorization code.

### API Errors

**Insufficient Permissions**:
```json
{
  "error": {
    "message": "(#200) Requires pages_show_list permission",
    "type": "OAuthException",
    "code": 200
  }
}
```

**Expired Token**:
```json
{
  "error": {
    "message": "Error validating access token: Session has expired",
    "type": "OAuthException",
    "code": 190
  }
}
```

### Error Recovery

1. **Check for error in response**:
   ```typescript
   if (data.error) {
     console.log('Permission not granted:', data.error.message);
     // Handle gracefully - don't crash
   }
   ```

2. **Log but continue**:
   - Tier detection should not fail if permissions missing
   - Set appropriate tier based on what's available

3. **Redirect with helpful message**:
   - Explain what went wrong
   - Provide next steps
   - Offer reconnect option

---

## 🔧 Configuration

### Environment Variables

**Required**:
```bash
FACEBOOK_APP_ID="1234567890123456"          # Facebook App ID
FACEBOOK_APP_SECRET="abc123..."             # Facebook App Secret
PUBLIC_BASE_URL="https://your-domain.com"   # Your app URL
```

**Important**: Always `.trim()` these values to remove newlines!

### Facebook App Settings

**App Domains**:
```
your-domain.com
```

**Valid OAuth Redirect URIs**:
```
https://your-domain.com/api/facebook/callback
```

**Platform**: Web

---

## 🚀 Deployment Checklist

### Before Going Live

- [ ] Facebook App in **Live** mode (not Development)
- [ ] All permissions approved via App Review
- [ ] App icon uploaded (1024x1024)
- [ ] Privacy Policy URL configured
- [ ] Terms of Service URL configured
- [ ] Data Deletion URL configured
- [ ] Valid OAuth redirect URIs configured
- [ ] Environment variables set on production
- [ ] Test OAuth flow end-to-end
- [ ] Test token refresh mechanism
- [ ] Monitor for expired tokens

---

## 📝 Testing

### Test Users
Create test users in Facebook Developer Console:
- Can grant any permission
- Don't need app review
- Perfect for testing Tier 1-3 flows

### Test Checklist

**Tier 0 Flow**:
- [ ] Connect with `public_profile` only
- [ ] See "Additional Permissions Needed" message
- [ ] Setup steps are visible
- [ ] Reconnect button appears

**Tier 1 Flow** (with test user):
- [ ] Connect with `pages_show_list`
- [ ] Page detected and saved
- [ ] `canBoostPosts` = true

**Tier 2 Flow** (with test user):
- [ ] Connect with `business_management`
- [ ] Business Manager detected
- [ ] Redirect to Ad Account setup

**Tier 3 Flow** (with test user):
- [ ] Connect with `ads_management`
- [ ] Ad Account detected
- [ ] `canCreateCampaigns` = true
- [ ] Full dashboard access

---

## 🐛 Common Issues

### Issue: "Invalid OAuth redirect URI"
**Cause**: Redirect URI not configured in Facebook App
**Fix**: Add exact redirect URI to Facebook Login settings

### Issue: "This app is in Development Mode"
**Cause**: App not submitted or approved
**Fix**: Complete app review process

### Issue: Tokens stored as "[object Object]"
**Cause**: Forgot to JSON.stringify() encrypted token
**Fix**: Wrap encrypt() result with JSON.stringify()

### Issue: "Error validating access token"
**Cause**: Token expired or invalid
**Fix**: Implement token refresh or require user to reconnect

---

**Last Updated**: October 28, 2025
