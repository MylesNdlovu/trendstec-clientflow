# SaaS Multi-Tenant Account Isolation Strategy
## How to Keep Each IB's Leads & Workflows Completely Separated

---

## 🎯 The Problem

You're building a SaaS where:
- **Multiple IBs** (John, Sarah, Mike, etc.) each pay for ClientFlow
- Each IB captures **their own leads**
- Each IB has **custom workflows** in Systeme.io
- **Critical**: John must NEVER see Sarah's leads
- **Critical**: Workflows must not mix between IBs

---

## 🏗️ Solution: 3-Layer Isolation System

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: CLIENTFLOW DATABASE                  │
│                      (Complete Hard Isolation)                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  User Table:                                                     │
│  ├─ John  (userId: "user-abc123")                              │
│  ├─ Sarah (userId: "user-def456")                              │
│  └─ Mike  (userId: "user-ghi789")                              │
│                                                                  │
│  Lead Table:                                                     │
│  ├─ Lead 1 (userId: "user-abc123") → Belongs to John ✅        │
│  ├─ Lead 2 (userId: "user-abc123") → Belongs to John ✅        │
│  ├─ Lead 3 (userId: "def456") → Belongs to Sarah ✅            │
│  └─ Lead 4 (userId: "ghi789") → Belongs to Mike ✅             │
│                                                                  │
│  Query Example:                                                  │
│  SELECT * FROM leads WHERE userId = 'user-abc123'               │
│  → Returns ONLY John's leads (never Sarah's or Mike's) ✅       │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 2: TAG PREFIX SYSTEM                    │
│                     (Logical Soft Isolation)                     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Each IB gets unique prefix:                                     │
│  ├─ John:  "ib-abc123-"                                         │
│  ├─ Sarah: "ib-def456-"                                         │
│  └─ Mike:  "ib-ghi789-"                                         │
│                                                                  │
│  All tags for John's leads start with "ib-abc123-":             │
│  ├─ "ib-abc123-demo-request"                                    │
│  ├─ "ib-abc123-forex-ib"                                        │
│  ├─ "ib-abc123-high-volume"                                     │
│  └─ "ib-abc123-converted"                                       │
│                                                                  │
│  All tags for Sarah's leads start with "ib-def456-":            │
│  ├─ "ib-def456-demo-request"                                    │
│  ├─ "ib-def456-crypto-affiliate"                                │
│  └─ "ib-def456-engaged"                                         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  LAYER 3: SYSTEME.IO WORKFLOWS                   │
│                    (Trigger-Based Isolation)                     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Workflow: "John's Welcome Sequence"                            │
│  TRIGGER: When tag "ib-abc123-demo-request" is added            │
│  → Only processes leads with John's prefix ✅                   │
│                                                                  │
│  Workflow: "Sarah's Welcome Sequence"                           │
│  TRIGGER: When tag "ib-def456-demo-request" is added            │
│  → Only processes leads with Sarah's prefix ✅                  │
│                                                                  │
│  Workflow: "Mike's Welcome Sequence"                            │
│  TRIGGER: When tag "ib-ghi789-demo-request" is added            │
│  → Only processes leads with Mike's prefix ✅                   │
│                                                                  │
│  Result: Each workflow only sees its own IB's leads! ✅         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Detailed Isolation Strategy

### **Step-by-Step Account Separation:**

#### **1. When IB Signs Up (ClientFlow Database)**

```typescript
// File: src/routes/signup/+page.server.ts

export const actions = {
  signup: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString();
    const name = data.get('name')?.toString();

    // Generate unique prefix for this IB
    const uniquePrefix = `ib-${nanoid(8)}-`;  // e.g., "ib-x7k2m4p9-"

    // Create IB account in YOUR database
    const newIB = await prisma.user.create({
      data: {
        email: email,
        name: name,
        role: 'USER',
        systemeTagPrefix: uniquePrefix,  // ← KEY: Unique identifier
        // Optional: Store Systeme.io setup status
        systemeWorkflowsConfigured: false
      }
    });

    return { success: true, userId: newIB.id };
  }
};
```

#### **2. When IB Captures a Lead (ClientFlow → Systeme.io)**

```typescript
// File: src/routes/api/demo-request/+server.ts

export const POST: RequestHandler = async ({ request, locals }) => {
  // Get logged-in IB
  const ib = locals.user;

  // Get lead data from form
  const leadData = await request.json();

  // 1. Save lead in YOUR database with IB's userId
  const lead = await prisma.lead.create({
    data: {
      userId: ib.id,  // ← CRITICAL: Links lead to specific IB
      email: leadData.email,
      name: leadData.name,
      phone: leadData.phone,
      ibType: leadData.ib_type,
      monthlyLeads: leadData.monthly_leads,
      brokerNetwork: leadData.broker_network
    }
  });

  // 2. Build IB-specific tags using their prefix
  const tags = [
    `${ib.systemeTagPrefix}demo-request`,      // "ib-x7k2m4p9-demo-request"
    `${ib.systemeTagPrefix}${leadData.ib_type}`, // "ib-x7k2m4p9-forex-ib"
  ];

  // Add volume-based tag
  if (leadData.monthly_leads === '500+') {
    tags.push(`${ib.systemeTagPrefix}high-volume`);
  }

  // 3. Send to Systeme.io with IB-specific tags
  await fetch('https://api.systeme.io/api/contacts', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.SYSTEME_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: leadData.email,
      locale: 'en',
      tags: tags,  // ← All tags have IB's unique prefix
      fields: [
        { slug: 'full_name', value: leadData.name },
        { slug: 'phone_number', value: leadData.phone },
        { slug: 'ib_owner_id', value: ib.id },  // ← Track which IB owns this
        { slug: 'ib_prefix', value: ib.systemeTagPrefix }  // ← For easy filtering
      ]
    })
  });

  // 4. Update lead with Systeme.io sync status
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      systemeTagsApplied: tags,
      systemeSyncedAt: new Date()
    }
  });

  return json({ success: true, leadId: lead.id });
};
```

#### **3. When IB Views Their Dashboard (ClientFlow)**

```typescript
// File: src/routes/dashboard/leads/+page.server.ts

export const load: PageServerLoad = async ({ locals }) => {
  const ib = locals.user;

  // Query ONLY this IB's leads from YOUR database
  const leads = await prisma.lead.findMany({
    where: {
      userId: ib.id  // ← CRITICAL: Filter by IB's userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Calculate stats for THIS IB only
  const stats = {
    totalLeads: leads.length,
    thisMonth: leads.filter(l =>
      l.createdAt >= new Date(new Date().setDate(1))
    ).length,
    converted: leads.filter(l =>
      l.systemeTagsApplied?.some(tag => tag.includes('converted'))
    ).length
  };

  return { leads, stats };
};
```

**Result**: John only sees his 47 leads, Sarah only sees her 89 leads. Complete isolation! ✅

---

## 🔄 Workflow Setup Per IB (Systeme.io Dashboard)

### **YOU (Admin) Set Up Workflows - One Time Per IB:**

#### **For IB John (prefix: "ib-abc123-"):**

**Workflow 1: Welcome Sequence**
```
Name: "John's Welcome Sequence"

TRIGGER: Tag "ib-abc123-demo-request" is added to contact
  ↓
ACTION: Wait 5 minutes
  ↓
ACTION: Send email "Welcome - John's Forex Program"
  Subject: "Welcome to John's Exclusive Forex Training"
  Body: "Hi {{first_name}}, I'm John and I'm excited..."
  ↓
ACTION: Wait 2 days
  ↓
CONDITION: Has contact opened email?
  YES → Add tag "ib-abc123-engaged"
       → Send email "Getting Started Guide"
  NO  → Wait 1 day
       → Send email "Did you miss my welcome message?"
  ↓
ACTION: Wait 3 days
  ↓
ACTION: Send email "How to maximize your trading"
  ↓
END
```

**Workflow 2: High-Value Lead Alert (John)**
```
Name: "John's VIP Lead Alert"

TRIGGER: Tag "ib-abc123-high-volume" is added
  ↓
ACTION: Send email to john@example.com
  Subject: "🔥 High-Value Lead Alert!"
  Body: "A lead with 500+ monthly volume signed up!"
  ↓
ACTION: Send email to lead
  Subject: "VIP Welcome from John"
  Body: "I noticed you're doing high volume..."
  ↓
ACTION: Add tag "ib-abc123-vip-prospect"
  ↓
END
```

---

#### **For IB Sarah (prefix: "ib-def456-"):**

**Workflow 1: Welcome Sequence**
```
Name: "Sarah's Crypto Welcome"

TRIGGER: Tag "ib-def456-demo-request" is added
  ↓
ACTION: Wait 10 minutes  ← Different timing than John!
  ↓
ACTION: Send email "Crypto Made Simple - Sarah"
  Subject: "Start Your Crypto Journey with Sarah"
  Body: "Hey {{first_name}}, Crypto can be confusing..."
  ↓
ACTION: Wait 1 day  ← Faster cadence than John!
  ↓
ACTION: Send email "Top 5 Crypto Trading Tips"
  ↓
ACTION: Add tag "ib-def456-engaged"
  ↓
END
```

**Workflow 2: Re-engagement (Sarah)**
```
Name: "Sarah's Re-engagement Campaign"

TRIGGER: Tag "ib-def456-inactive" is added
  ↓
ACTION: Wait 7 days
  ↓
ACTION: Send email "We miss you!"
  ↓
CONDITION: Email opened?
  YES → Add tag "ib-def456-re-engaged"
  NO  → Add tag "ib-def456-churned"
  ↓
END
```

---

## 🛡️ Isolation Guarantee: The 3 Checks

### **Check 1: Database Level (Hard Isolation)**

```sql
-- When John queries his leads:
SELECT * FROM leads
WHERE userId = 'user-abc123';

-- Returns ONLY:
-- lead1@email.com (John's)
-- lead2@email.com (John's)
-- lead3@email.com (John's)

-- Will NEVER return:
-- sarah_lead@email.com (Sarah's)
-- mike_lead@email.com (Mike's)
```

### **Check 2: API Level (Authorization)**

```typescript
// Every API route checks ownership
export const load: PageServerLoad = async ({ locals, params }) => {
  const ib = locals.user;
  const leadId = params.id;

  // Fetch lead with ownership check
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      userId: ib.id  // ← Must match logged-in IB
    }
  });

  if (!lead) {
    // Lead doesn't exist OR doesn't belong to this IB
    throw error(404, 'Lead not found');
  }

  return { lead };
};
```

### **Check 3: Systeme.io Level (Tag-Based Filtering)**

```typescript
// When fetching contacts from Systeme.io
const systemeContacts = await fetch('https://api.systeme.io/api/contacts', {
  headers: { 'X-API-Key': apiKey },
  params: {
    tags: ib.systemeTagPrefix  // ← Only fetch contacts with this IB's prefix
  }
});

// John's query (prefix: "ib-abc123-"):
// Returns contacts with tags starting with "ib-abc123-"

// Sarah's query (prefix: "ib-def456-"):
// Returns contacts with tags starting with "ib-def456-"

// Complete separation! ✅
```

---

## 📊 Visual Representation: 3 IBs Using ClientFlow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTFLOW SAAS                           │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  IB John    → systemeTagPrefix: "ib-abc123-"                    │
│            → Leads in DB: 47                                     │
│            → Workflows: Welcome Sequence, VIP Alert              │
│                                                                  │
│  IB Sarah  → systemeTagPrefix: "ib-def456-"                     │
│            → Leads in DB: 89                                     │
│            → Workflows: Crypto Welcome, Re-engagement            │
│                                                                  │
│  IB Mike   → systemeTagPrefix: "ib-ghi789-"                     │
│            → Leads in DB: 23                                     │
│            → Workflows: CFD Onboarding, High-Value               │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SYSTEME.IO BACKEND                          │
│                    (Single Shared Instance)                      │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Contacts:                                                       │
│  ├─ trader1@gmail.com                                           │
│  │   Tags: ["ib-abc123-demo-request", "ib-abc123-forex-ib"]    │
│  │   → Belongs to John ✅                                       │
│  │                                                               │
│  ├─ trader2@gmail.com                                           │
│  │   Tags: ["ib-def456-demo-request", "ib-def456-crypto"]      │
│  │   → Belongs to Sarah ✅                                      │
│  │                                                               │
│  └─ trader3@gmail.com                                           │
│      Tags: ["ib-ghi789-demo-request", "ib-ghi789-cfd"]         │
│      → Belongs to Mike ✅                                        │
│                                                                  │
│  Workflows:                                                      │
│  ├─ "John's Welcome" (Trigger: ib-abc123-demo-request)         │
│  ├─ "John's VIP Alert" (Trigger: ib-abc123-high-volume)        │
│  ├─ "Sarah's Welcome" (Trigger: ib-def456-demo-request)        │
│  ├─ "Sarah's Re-engage" (Trigger: ib-def456-inactive)          │
│  ├─ "Mike's Onboarding" (Trigger: ib-ghi789-demo-request)      │
│  └─ "Mike's High-Value" (Trigger: ib-ghi789-vip)               │
│                                                                  │
│  → All workflows isolated by tag prefix! ✅                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚨 What Happens if Same Email is Captured by Two IBs?

**Scenario**: `trader@example.com` signs up through BOTH John and Sarah

```typescript
// John captures trader@example.com
→ Creates contact in Systeme.io with tags:
  ["ib-abc123-demo-request", "ib-abc123-forex-ib"]
→ Triggers "John's Welcome Sequence"

// Sarah captures trader@example.com (same email!)
→ ADDS tags to existing contact:
  ["ib-def456-demo-request", "ib-def456-crypto"]
→ Triggers "Sarah's Welcome Sequence"

// Result: trader@example.com now has tags from BOTH IBs
// BUT: Each workflow only triggers for its own prefix
// trader@example.com receives TWO welcome sequences (one from John, one from Sarah)
```

**Is this a problem?**
- ✅ **No** - The lead signed up through both IBs voluntarily
- ✅ Each IB can track their own relationship
- ✅ Each IB sees the lead in their own dashboard
- ✅ Workflows remain isolated by prefix

**If you want to prevent this:**
```typescript
// Check if email already exists in Systeme.io before creating
const existingContact = await systemeAPI.findByEmail(leadData.email);

if (existingContact && existingContact.tags.some(tag => !tag.startsWith(ib.systemeTagPrefix))) {
  return error(400, 'This lead is already registered with another IB');
}
```

---

## ✅ Setup Checklist

### **Phase 1: Database Setup**
- [ ] Add `systemeTagPrefix` field to User model
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Generate prefixes for existing users
- [ ] Add `userId` foreign key to Lead model

### **Phase 2: ClientFlow Code**
- [ ] Update lead capture API to include IB's prefix in tags
- [ ] Add userId filter to all lead queries
- [ ] Test: John can't see Sarah's leads
- [ ] Test: Sarah can't see John's leads

### **Phase 3: Systeme.io Workflows (Per IB)**
- [ ] For IB #1: Create workflows with their prefix
- [ ] For IB #2: Clone workflows, update prefix
- [ ] For IB #3: Clone workflows, update prefix
- [ ] Test: Each workflow only triggers for correct IB

### **Phase 4: Testing**
- [ ] Create 3 test IB accounts
- [ ] Capture lead as IB #1
- [ ] Verify: Lead appears in IB #1's dashboard only
- [ ] Verify: IB #1's workflow triggers in Systeme.io
- [ ] Verify: IB #2 and #3 don't see the lead
- [ ] Repeat for all 3 IBs

---

## 🎯 Summary

### **3-Layer Isolation:**
1. **ClientFlow Database** → Hard isolation via `userId`
2. **Tag Prefix System** → Logical isolation via unique prefixes
3. **Systeme.io Workflows** → Trigger isolation via prefix-based tags

### **Guarantees:**
✅ **Each IB only sees their own leads** (database userId check)
✅ **Workflows never mix** (tag prefix triggers)
✅ **Complete data privacy** (API authorization checks)
✅ **Scalable to unlimited IBs** (each gets unique prefix)

### **Your Responsibilities:**
- Generate unique prefix for each new IB
- Set up Systeme.io workflows per IB (one-time)
- Ensure all API routes check userId ownership

### **Result:**
Professional multi-tenant SaaS where each IB has their own isolated environment, while Systeme.io handles all the complex automation in the background! 🚀
