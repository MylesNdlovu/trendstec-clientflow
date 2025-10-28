# API Documentation

> SvelteKit API routes for TrendsTec ClientFlow

## 📋 Table of Contents

- [Authentication](#authentication)
- [Facebook Integration](#facebook-integration)
- [Lead Management](#lead-management)
- [Campaign Management](#campaign-management)
- [Commission Tracking](#commission-tracking)

---

## 🔐 Authentication

All authenticated endpoints require a valid JWT token in either:
- Cookie: `auth-token`
- Header: `Authorization: Bearer <token>`

### POST `/api/auth/login`
**Purpose**: User login

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "clxxx",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "IB"
  }
}
```

**Response** (401):
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

## 📱 Facebook Integration

### GET `/api/facebook/auth`
**Purpose**: Initiate Facebook OAuth flow

**Auth**: Required

**Flow**:
1. Redirects user to Facebook OAuth
2. Facebook redirects back to `/api/facebook/callback`
3. Callback saves account and redirects to dashboard

**Query Params**: None

**Response**: `302 Redirect` to Facebook OAuth URL

---

### GET `/api/facebook/callback`
**Purpose**: Handle Facebook OAuth callback

**Auth**: Not required (uses state parameter for user ID)

**Query Params**:
- `code` (string) - OAuth authorization code
- `state` (string) - User ID from initial auth request
- `error` (string, optional) - Error from Facebook

**Flow**:
1. Exchange code for access token
2. Exchange for long-lived token (60 days)
3. Detect Facebook setup (Tier 0-3)
4. Save/update `FacebookAdAccount` in database
5. Redirect based on setupTier:
   - Tier 0: `/dashboard/ads?success=connected&tier=0&message=basic_profile_only`
   - Tier 1: `/dashboard/ads?success=basic_connected&upgrade=available`
   - Tier 2: `/dashboard/ads/setup?step=ad_account`
   - Tier 3: `/dashboard/ads?success=connected`

**Setup Tier Detection**:
- Calls `/me/accounts` (requires `pages_show_list`)
- Calls `/me/businesses` (requires `business_management`)
- Calls `/{business_id}/adaccounts` (requires `ads_management`)

**Error Redirects**:
- Access denied: `/dashboard/ads?error=access_denied`
- Invalid callback: `/dashboard/ads?error=invalid_callback`
- Token exchange failed: `/dashboard/ads?error=token_exchange_failed&details=...`
- General error: `/dashboard/ads?error=callback_failed&name=...&message=...`

---

### GET `/api/facebook/account`
**Purpose**: Get user's Facebook account status

**Auth**: Required

**Response** (200):
```json
{
  "success": true,
  "hasAccount": true,
  "account": {
    "id": "clxxx",
    "setupTier": 0,
    "pageId": null,
    "pageName": null,
    "businessId": null,
    "businessName": null,
    "adAccountId": null,
    "adAccountName": null,
    "isConnected": true,
    "canBoostPosts": false,
    "canCreateCampaigns": false,
    "lastSyncAt": "2025-10-28T12:00:00Z"
  }
}
```

**Response** (200 - No account):
```json
{
  "success": true,
  "hasAccount": false,
  "account": null
}
```

**Response** (500):
```json
{
  "success": false,
  "error": "Failed to fetch account"
}
```

---

### GET `/api/facebook/campaigns`
**Purpose**: Get user's ad campaigns

**Auth**: Required

**Query Params**:
- `status` (string, optional) - Filter by status: "ACTIVE", "PAUSED", "DRAFT", "COMPLETED"
- `limit` (number, optional) - Limit results (default: 50)
- `offset` (number, optional) - Pagination offset (default: 0)

**Response** (200):
```json
{
  "success": true,
  "campaigns": [
    {
      "id": "clxxx",
      "name": "Forex Trading Campaign",
      "status": "ACTIVE",
      "campaignType": "CAMPAIGN",
      "objective": "LEAD_GENERATION",
      "dailyBudget": 50.00,
      "totalSpent": 125.50,
      "impressions": 5000,
      "clicks": 150,
      "leads": 12,
      "ctr": 3.0,
      "cpc": 0.84,
      "cpl": 10.46,
      "startDate": "2025-10-20T00:00:00Z",
      "lastSyncAt": "2025-10-28T12:00:00Z"
    }
  ],
  "total": 1,
  "hasMore": false
}
```

---

### GET `/api/facebook/stats`
**Purpose**: Get ad spend statistics

**Auth**: Required

**Query Params**:
- `days` (number, optional) - Days to include (default: 30)

**Response** (200):
```json
{
  "success": true,
  "stats": {
    "period": {
      "start": "2025-09-28T00:00:00Z",
      "end": "2025-10-28T00:00:00Z"
    },
    "totalSpend": 1250.00,
    "totalImpressions": 50000,
    "totalClicks": 1500,
    "totalLeads": 120,
    "totalConversions": 45,
    "avgCpc": 0.83,
    "avgCpl": 10.42,
    "ctr": 3.0,
    "dailyAverage": 41.67,
    "history": [
      {
        "date": "2025-10-28",
        "spend": 45.00,
        "impressions": 2000,
        "clicks": 60,
        "leads": 5
      }
    ]
  }
}
```

---

### GET `/api/facebook/templates`
**Purpose**: Get available campaign templates

**Auth**: Required

**Query Params**:
- `category` (string, optional) - Filter by category

**Response** (200):
```json
{
  "success": true,
  "templates": [
    {
      "id": "clxxx",
      "name": "Forex Lead Generation",
      "description": "Proven template for forex trading leads",
      "category": "lead_generation",
      "thumbnailUrl": "https://...",
      "usageCount": 45,
      "templateData": {
        "targeting": {
          "age_min": 25,
          "age_max": 55,
          "interests": [...]
        },
        "adCopy": "...",
        "callToAction": "LEARN_MORE",
        "dailyBudget": 50
      }
    }
  ]
}
```

---

## 📊 Lead Management

### GET `/api/leads`
**Purpose**: Get user's leads

**Auth**: Required

**Query Params**:
- `status` (string, optional) - Filter by status
- `leadType` (string, optional) - Filter by type: "trader" or "ib"
- `limit` (number, optional) - Limit results (default: 50)
- `offset` (number, optional) - Pagination offset

**Response** (200):
```json
{
  "success": true,
  "leads": [
    {
      "id": "clxxx",
      "email": "lead@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "qualified",
      "leadType": "trader",
      "source": "facebook_ads",
      "leadCapturedAt": "2025-10-28T12:00:00Z",
      "totalEarned": 250.00
    }
  ],
  "total": 1,
  "hasMore": false
}
```

---

### POST `/api/leads`
**Purpose**: Create new lead

**Auth**: Required

**Request**:
```json
{
  "email": "lead@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "source": "facebook_ads",
  "leadType": "trader"
}
```

**Response** (201):
```json
{
  "success": true,
  "lead": {
    "id": "clxxx",
    "email": "lead@example.com",
    "status": "captured",
    "trackingToken": "unique-token"
  }
}
```

---

## 💰 Commission Tracking

### GET `/api/commissions`
**Purpose**: Get IB's commission history

**Auth**: Required (IB role)

**Query Params**:
- `year` (number, optional) - Filter by year
- `month` (number, optional) - Filter by month (1-12)
- `status` (string, optional) - Filter by payment status

**Response** (200):
```json
{
  "success": true,
  "commissions": [
    {
      "id": "clxxx",
      "month": 10,
      "year": 2025,
      "totalAdSpend": 1500.00,
      "totalLeads": 45,
      "qualifiedLeads": 12,
      "totalCpaEarned": 1200.00,
      "commissionRate": 0.30,
      "commissionAmount": 360.00,
      "bonusAmount": 50.00,
      "totalPayout": 410.00,
      "paymentStatus": "PAID",
      "paidAt": "2025-11-05T12:00:00Z"
    }
  ]
}
```

---

## 🔧 Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no auth token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔐 Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": "Additional details (optional)"
}
```

---

## 📝 Notes

### Facebook Token Refresh
- Access tokens expire after 60 days
- System should automatically request new token before expiry
- If token expires, user will need to reconnect Facebook

### Rate Limiting
- Currently no rate limiting implemented
- Consider adding rate limiting for production

### Pagination
- All list endpoints support `limit` and `offset`
- Default limit: 50 items
- `hasMore` field indicates if more results available

---

**Last Updated**: October 28, 2025
