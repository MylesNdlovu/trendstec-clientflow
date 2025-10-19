# Simplified Role System & Lead Capture Strategy

## 🎯 Current Role System Analysis

### Current Roles (3 Levels)
```
SUPER_ADMIN → ADMIN → USER
```

**Problems with current setup:**
1. **SUPER_ADMIN vs ADMIN confusion** - Both have similar permissions, unclear distinction
2. **USER role is actually IB/Affiliate** - Misleading name
3. **No distinction between IB leads and Trader leads** in the Lead model
4. **Overcomplicated for a SaaS platform** with only 2 real user types

---

## ✅ SIMPLIFIED ROLE SYSTEM (Recommended)

### Two Roles Only:

```
ADMIN (You/ClientFlow Team) → IB (Your Customers)
```

### Role Definitions:

#### 1️⃣ **ADMIN Role** (ClientFlow Team)
**Who:** You and your team managing the platform

**Access:**
- ✅ Full platform access
- ✅ Manage all IBs (create, edit, deactivate)
- ✅ View all leads across all IBs
- ✅ Configure FTD/CPA settings
- ✅ Manage integrations (Systeme.io, MT5)
- ✅ Admin dashboard with analytics

**Database:**
```prisma
enum Role {
  ADMIN  // Platform owner/team
  IB     // Independent Broker/Affiliate customer
}
```

#### 2️⃣ **IB Role** (Your SaaS Customers)
**Who:** IBs/Affiliates who pay you $297/mo

**Access:**
- ✅ Their own dashboard
- ✅ View ONLY their leads (userId filter)
- ✅ Forms to capture trader leads
- ✅ Commission tracking for their traders
- ✅ MT5 credential forms for their traders
- ❌ Cannot see other IBs' data
- ❌ Cannot access admin settings

---

## 📊 LEAD CAPTURE STRATEGY

### Two Types of Leads:

```
┌─────────────────────────────────────────────────────┐
│                  ClientFlow Platform                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. IB LEADS (People who want to become IBs)        │
│     → Captured via: /funding landing page            │
│     → Goal: Convert to paying $297/mo customers      │
│     → Workflow: Systeme.io ONLY (no MT5 needed)     │
│                                                      │
│  2. TRADER LEADS (IBs' leads who are traders)       │
│     → Captured via: IB's custom forms                │
│     → Goal: Deposit → Trade → IB earns commission   │
│     → Workflow: Systeme.io + MT5 scraping           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Lead Type 1: IB LEADS (Your Leads)

### Capture Flow:
```
Landing Page (/funding)
    ↓
Optin Form (Email, Name, Phone)
    ↓
Systeme.io API (tags: 'funding-offer', '1000-funding', 'lead-magnet')
    ↓
Workflow Backend nurtures lead
    ↓
Lead books call / pays $297
    ↓
YOU manually create IB account in Admin Dashboard
```

### What You Need:
- ✅ **Optin Form** (Already created at `/funding`)
- ✅ **Systeme.io Integration** (Already working)
- ✅ **Workflow Backend** (Systeme.io handles email sequences)
- ❌ **NO MT5 scraping needed** (IBs don't trade, they refer traders)
- ❌ **NO Playwright needed** (Just email nurture)

### Database Storage:
**Option A: Store in Lead model with type field**
```prisma
model Lead {
  id         String   @id @default(cuid())
  email      String?
  firstName  String?
  lastName   String?
  phone      String?

  // NEW FIELD
  leadType   String   @default("trader")  // "ib" or "trader"

  // For IB leads, these are null
  broker     String?  // null for IB leads
  mt5Login   String?  // null for IB leads

  // For Trader leads, this is null
  ibOwnerId  String?  // which IB owns this trader lead

  status     String   @default("captured")
  source     String   @default("unknown")
  createdAt  DateTime @default(now())
}
```

**Option B: Separate IbLead model (Cleaner)**
```prisma
model IbLead {
  id                String   @id @default(cuid())
  email             String?
  firstName         String?
  lastName          String?
  phone             String?
  source            String   @default("funding-page")
  status            String   @default("prospect")  // prospect, contacted, qualified, customer
  systemeContactId  String?
  convertedToIbAt   DateTime?  // When they became paying customer
  convertedIbId     String?    // Link to User table when they pay
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("ib_leads")
}
```

---

## 🔄 Lead Type 2: TRADER LEADS (IBs' Leads)

### Capture Flow:
```
IB shares their custom form link
    ↓
Trader fills MT5 Investor Form
    ↓
Lead stored in ClientFlow database (userId = IB's ID)
    ↓
Systeme.io API (tags: 'mt5-lead', 'ib-{ibId}-trader')
    ↓
Workflow Backend sends MT5 setup emails
    ↓
Playwright scrapes MT5 for deposit/trade verification
    ↓
IB earns FTD/CPA commission
```

### What You Need:
- ✅ **MT5 Investor Form** (Already created at `/forms/mt5-investor`)
- ✅ **Systeme.io Integration** (Already working)
- ✅ **MT5 Scraping** (Playwright - for trader verification)
- ✅ **Commission Tracking** (FTD/CPA calculations)

### Database Storage:
```prisma
model Lead {
  id                  String               @id @default(cuid())
  email               String?
  firstName           String?
  lastName            String?
  phone               String?
  broker              String?

  // NEW: Link to IB who owns this lead
  userId              String?              // Which IB captured this lead

  leadType            String               @default("trader")
  status              String               @default("captured")
  source              String               @default("unknown")

  // Trader-specific fields
  depositedAt         DateTime?
  tradingStartAt      DateTime?
  ftdEarned           Float                @default(0)
  cpaEarned           Float                @default(0)
  totalEarned         Float                @default(0)

  investorCredentials InvestorCredential[]

  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  @@map("leads")
}
```

---

## 🎯 RECOMMENDED CHANGES

### 1. Update Role Enum
```prisma
enum Role {
  ADMIN  // Was: SUPER_ADMIN + ADMIN
  IB     // Was: USER
}
```

### 2. Add Lead Type Field
```prisma
model Lead {
  // ... existing fields ...

  leadType   String   @default("trader")  // "ib" or "trader"
  userId     String?  // IB who owns this trader lead (null for IB leads)

  // ... rest of fields ...
}
```

### 3. Update Middleware
```typescript
// src/lib/server/auth/middleware.ts
export async function requireAdmin(event: RequestEvent) {
  return requireRole(event, ['ADMIN']);  // Remove SUPER_ADMIN
}

export async function requireIB(event: RequestEvent) {
  return requireRole(event, ['IB']);  // Renamed from USER
}
```

---

## 🚫 What You DON'T Need for IB Leads

### For IB Leads (People signing up to become IBs):
- ❌ **NO MT5 Scraping** - IBs don't trade, they refer traders
- ❌ **NO Playwright** - Not checking trades for IB prospects
- ❌ **NO InvestorCredential table** - IBs don't provide MT5 access
- ❌ **NO FTD/CPA tracking** - That's for their trader leads, not them
- ✅ **ONLY Systeme.io** - Email nurture to convert them to paying customers

### You ONLY use Systeme.io for:
1. **Email sequences** - Nurture IB prospects
2. **Follow-up automation** - Book calls, send reminders
3. **Tag-based workflows** - Different sequences for different lead sources

---

## 📝 SIMPLE WORKFLOW COMPARISON

### IB Lead Workflow (Your Leads - SIMPLE):
```
Landing Page Form
    ↓
Systeme.io (email nurture)
    ↓
Sales call
    ↓
Manually create account
```
**Tech needed:** Optin form + Systeme.io API

---

### Trader Lead Workflow (IBs' Leads - COMPLEX):
```
IB's Form
    ↓
ClientFlow DB + Systeme.io (email sequences)
    ↓
MT5 Credentials submitted
    ↓
Playwright scrapes MT5 data
    ↓
Verify deposit/trading
    ↓
Calculate commission for IB
```
**Tech needed:** MT5 Form + Systeme.io API + Playwright + DB

---

## ✅ MIGRATION PLAN

1. **Add leadType field to Lead model**
2. **Rename USER role to IB**
3. **Remove SUPER_ADMIN (merge with ADMIN)**
4. **Update all role checks in code**
5. **Tag IB leads vs Trader leads differently in Systeme.io**

---

## 🎯 FINAL RECOMMENDATION

### For IB Leads (Your Customers):
```typescript
// Use simple optin form
// Store in Lead table with leadType = "ib"
// Send to Systeme.io with tags: ['ib-prospect', 'funding-offer']
// NO MT5 scraping needed
// Manually convert to IB account when they pay
```

### For Trader Leads (IBs' Customers):
```typescript
// Use MT5 Investor Form
// Store in Lead table with leadType = "trader" and userId = IB's ID
// Send to Systeme.io with tags: ['trader-lead', 'ib-{ibId}-trader']
// YES MT5 scraping needed
// Auto-calculate commissions for IB
```

---

## 🔑 Key Takeaways

1. **Roles:** ADMIN (you) + IB (customers) = 2 roles only
2. **IB Leads:** Systeme.io ONLY - No MT5 needed
3. **Trader Leads:** Systeme.io + MT5 scraping needed
4. **Database:** Add `leadType` field to distinguish
5. **Simplicity:** IB lead capture is just optin form → email nurture → manual account creation

**Bottom line:** You can absolutely use JUST Systeme.io for IB leads without any MT5/Playwright complexity. That's only needed for trader leads.
