# Database Schema Documentation

> PostgreSQL database via Prisma ORM

## 📊 Schema Overview

The database is organized into these main modules:
1. **User Management** - Authentication and roles
2. **Lead Management** - Trading leads and IB leads
3. **Facebook Ads** - Ad accounts, campaigns, templates, spend tracking
4. **MT5 Integration** - Investor credentials, positions, trades
5. **Commissions** - IB earnings and payouts
6. **Automation** - Scraping jobs, workflows, integrations

---

## 🔑 Core Models

### User
**Purpose**: User accounts (IBs and Admins)

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| email | String (unique) | Login email |
| password | String | Hashed password |
| role | Role enum | IB or ADMIN |
| isActive | Boolean | Account status |
| emailVerified | Boolean | Email verification status |
| failedLoginCount | Int | Security: track failed logins |
| lockedUntil | DateTime? | Account lockout timestamp |

**Relations**:
- `leads[]` - Trading leads owned by this IB
- `facebookAdAccounts[]` - Facebook ad accounts
- `adCampaigns[]` - Ad campaigns created
- `ibCommissions[]` - Commission earnings

**Enums**:
```prisma
enum Role {
  IB      // Independent Broker/Affiliate
  ADMIN   // Platform administrator
}
```

---

### Lead
**Purpose**: Trading leads and IB leads

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String? | IB owner (null = platform leads) |
| leadType | String | "trader" or "ib" |
| email | String? | Contact email |
| firstName | String? | Contact name |
| phone | String? | Contact phone |
| broker | String? | Trading broker |
| source | String | Lead source (default: "unknown") |
| status | String | "captured", "contacted", "qualified", etc. |
| trackingToken | String? (unique) | Unique tracking identifier |
| leadCapturedAt | DateTime | When lead was captured |
| depositedAt | DateTime? | When first deposit made |
| tradingStartAt | DateTime? | When trading started |
| qualifiedAt | DateTime? | When lead qualified for commission |
| ftdEarned | Float | First Time Deposit commission |
| cpaEarned | Float | Cost Per Acquisition commission |
| totalEarned | Float | Total commission from this lead |
| systemeContactId | String? | Systeme.io contact ID |

**Relations**:
- `user` - IB who owns this lead
- `investorCredentials[]` - MT5 accounts
- `activities[]` - Lead activity log

**Indexes**: `userId`, `leadType`

---

## 📱 Facebook Ads Module

### FacebookAdAccount
**Purpose**: User's Facebook integration status and setup tier

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | IB owner |
| setupTier | Int | 0=none, 1=page, 2=business, 3=full |
| pageId | String? | Facebook Page ID |
| pageName | String? | Facebook Page name |
| pageAccessToken | String? | **ENCRYPTED** Page access token |
| businessId | String? | Business Manager ID |
| businessName | String? | Business Manager name |
| adAccountId | String? (unique) | Ad Account ID |
| adAccountName | String? | Ad Account name |
| accessToken | String? | **ENCRYPTED** User access token |
| tokenExpiresAt | DateTime? | Token expiration |
| canBoostPosts | Boolean | Tier 1+ capability |
| canCreateCampaigns | Boolean | Tier 3+ capability |
| isConnected | Boolean | Connection status |
| lastSyncAt | DateTime? | Last data sync |
| currency | String | Ad account currency (default: "USD") |
| timezone | String | Ad account timezone (default: "UTC") |

**Setup Tiers**:
- **Tier 0**: Basic profile only (public_profile permission)
- **Tier 1**: Has Facebook Page (pages_show_list permission)
- **Tier 2**: Has Business Manager (business_management permission)
- **Tier 3**: Has Ad Account (ads_management permission) - FULL ACCESS

**Security**:
- `accessToken` and `pageAccessToken` are **encrypted at rest** using AES-256-GCM
- Encryption handled by `/src/lib/server/security/encryption.ts`
- Stored as JSON string: `{"encrypted":"...","iv":"...","tag":"..."}`

**Relations**:
- `user` - IB owner
- `campaigns[]` - Ad campaigns
- `spendHistory[]` - Daily spend tracking

**Indexes**: `userId`, `adAccountId` (unique)

---

### AdTemplate
**Purpose**: Pre-built campaign templates (created by admins)

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Template name |
| description | String? | Template description |
| category | String | "lead_generation", "conversion", "awareness" |
| templateData | Json | **Template configuration** (see below) |
| thumbnailUrl | String? | Preview image |
| isActive | Boolean | Published status |
| isPublic | Boolean | Visible to all IBs |
| createdBy | String? | Admin user ID |
| usageCount | Int | Times used by IBs |

**templateData JSON Structure**:
```json
{
  "targeting": {
    "age_min": 25,
    "age_max": 55,
    "genders": [1, 2],
    "geo_locations": {
      "countries": ["US", "CA"]
    },
    "interests": [
      {"id": "6003107902433", "name": "Trading"}
    ]
  },
  "adCopy": "Start trading forex today...",
  "headline": "Learn Forex Trading",
  "callToAction": "LEARN_MORE",
  "objective": "LEAD_GENERATION",
  "dailyBudget": 50,
  "lifetimeBudget": null
}
```

**Relations**:
- `campaigns[]` - Campaigns created from this template

---

### AdCampaign
**Purpose**: User's created ad campaigns

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | IB owner |
| adAccountId | String | Facebook ad account |
| templateId | String? | Template used (if any) |
| fbCampaignId | String? (unique) | Facebook campaign ID (Tier 3) |
| fbAdSetId | String? | Facebook ad set ID |
| fbAdId | String? | Facebook ad ID |
| fbPostId | String? | Facebook post ID (Tier 1 boost) |
| fbPromotionId | String? | Promotion ID (boost) |
| name | String | Campaign name |
| objective | String | "LEAD_GENERATION", "CONVERSIONS", etc. |
| status | String | "DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ERROR" |
| campaignType | String | "BOOST" (Tier 1) or "CAMPAIGN" (Tier 3) |
| dailyBudget | Float? | Daily budget limit |
| lifetimeBudget | Float? | Total budget limit |
| totalSpent | Float | Amount spent so far |
| remainingBudget | Float? | Budget remaining |
| targetingData | Json | Targeting configuration |
| adCopy | String? | Ad copy text |
| imageUrl | String? | Ad image URL |
| videoUrl | String? | Ad video URL |
| callToAction | String? | "LEARN_MORE", "SIGN_UP", etc. |
| impressions | Int | Total impressions |
| clicks | Int | Total clicks |
| leads | Int | Total leads generated |
| conversions | Int | Total conversions |
| ctr | Float | Click-through rate |
| cpc | Float | Cost per click |
| cpl | Float | Cost per lead |
| roas | Float | Return on ad spend |
| startDate | DateTime? | Campaign start |
| endDate | DateTime? | Campaign end |
| lastSyncAt | DateTime? | Last sync from Facebook |
| errorMessage | String? | Error details |
| errorCount | Int | Error occurrence count |

**Relations**:
- `user` - IB owner
- `adAccount` - Facebook ad account
- `template` - Template used (optional)

**Indexes**: `userId`, `adAccountId`, `status`, `campaignType`

---

### AdSpendHistory
**Purpose**: Daily ad spend tracking

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | IB owner |
| adAccountId | String | Facebook ad account |
| date | DateTime (@db.Date) | Spend date |
| dailySpend | Float | Amount spent this day |
| impressions | Int | Impressions this day |
| clicks | Int | Clicks this day |
| leads | Int | Leads generated this day |
| conversions | Int | Conversions this day |
| ctr | Float | Click-through rate |
| cpc | Float | Cost per click |
| cpl | Float | Cost per lead |
| cumulativeSpend | Float | Running total spend |
| cumulativeLeads | Int | Running total leads |

**Unique Constraint**: `(adAccountId, date)` - one record per account per day

**Relations**:
- `user` - IB owner
- `adAccount` - Facebook ad account

**Indexes**: `userId, date`

---

## 💰 Commission Module

### IbCommission
**Purpose**: Monthly commission calculations for IBs

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | IB recipient |
| month | Int | Month (1-12) |
| year | Int | Year |
| totalAdSpend | Float | IB's ad spend this month |
| totalLeads | Int | Leads generated |
| qualifiedLeads | Int | Leads that converted |
| totalCpaEarned | Float | Platform's CPA earnings from IB's leads |
| commissionRate | Float | Rate applied (e.g., 0.30 = 30%) |
| commissionAmount | Float | Amount owed to IB |
| bonusAmount | Float | Spend bonus |
| totalPayout | Float | Total to pay IB |
| paymentStatus | String | "PENDING", "PROCESSING", "PAID", "HELD" |
| paidAt | DateTime? | Payment date |
| paymentMethod | String? | "bank_transfer", "paypal", etc. |
| paymentReference | String? | Payment reference number |

**Unique Constraint**: `(userId, month, year)`

**Relations**:
- `user` - IB recipient

**Indexes**: `userId`, `paymentStatus`

---

## 🔧 MT5 Integration

### InvestorCredential
**Purpose**: MT5 investor account credentials

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| leadId | String? | Associated lead |
| login | String | MT5 login |
| password | String | **ENCRYPTED** MT5 password |
| server | String | MT5 server |
| broker | String | Broker name (default: "Prime XBT") |
| isVerified | Boolean | Credentials verified |
| balance | Float? | Account balance |
| equity | Float? | Account equity |
| totalVolume | Float? | Total trading volume |
| meetsMinVolume | Boolean | Meets volume requirement |
| scrapingStatus | String | "pending", "success", "failed" |
| failedAttempts | Int | Scraping failure count |
| lastScrapedAt | DateTime? | Last data scrape |

**Security**: Password is **encrypted at rest**

**Relations**:
- `lead` - Associated lead
- `positions[]` - Open positions
- `trades[]` - Trade history

---

## 📈 Scraping & Automation

### ScrapingJob
**Purpose**: Automated web scraping tasks

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Job name |
| targetUrl | String | URL to scrape |
| jobType | String | "one-time" or "recurring" |
| schedule | String? | Cron schedule |
| status | String | "pending", "running", "completed", "failed" |
| extractionRules | String? (JSON) | Data extraction rules |
| triggerWorkflowId | String? | Workflow to trigger |

**Relations**:
- `scrapedData[]` - Scraped results
- `executions[]` - Execution history
- `workflow` - Triggered workflow
- `authProfile` - Authentication details

---

## 🔐 Security Notes

### Encrypted Fields
These fields are encrypted at rest using AES-256-GCM:

1. **FacebookAdAccount**:
   - `accessToken` - Facebook user access token
   - `pageAccessToken` - Facebook page access token

2. **InvestorCredential**:
   - `password` - MT5 password

3. **SystemeConfig**:
   - `apiKey` - Systeme.io API key
   - `password` - Systeme.io password

**Encryption Implementation**: `/src/lib/server/security/encryption.ts`

**Storage Format**:
```json
{
  "encrypted": "hex string",
  "iv": "hex string",
  "tag": "hex string"
}
```

### Environment Variables Required
- `ENCRYPTION_KEY` - 32-character encryption key
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection (for migrations)

---

## 📝 Common Queries

### Get User's Facebook Account
```typescript
const account = await prisma.facebookAdAccount.findFirst({
  where: { userId: user.id },
  orderBy: { createdAt: 'desc' }
});
```

### Get Active Campaigns
```typescript
const campaigns = await prisma.adCampaign.findMany({
  where: {
    userId: user.id,
    status: 'ACTIVE'
  },
  include: {
    adAccount: true,
    template: true
  }
});
```

### Calculate Monthly Commission
```typescript
const commission = await prisma.ibCommission.findUnique({
  where: {
    userId_month_year: {
      userId: user.id,
      month: 10,
      year: 2025
    }
  }
});
```

---

**Last Updated**: October 28, 2025
