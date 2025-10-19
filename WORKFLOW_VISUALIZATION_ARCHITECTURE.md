# Workflow Visualization & Multi-Tenant Architecture

## 🔍 Problem Analysis

### **Your Requirements:**
1. ✅ Show IBs a visual representation of their workflow automation
2. ✅ Allow IBs to edit email templates and sync with Systeme.io
3. ✅ Keep each IB's account isolated (no role conflicts)
4. ✅ Lightweight UI (not heavy on resources)
5. ✅ Systeme.io stays hidden as backend

### **Systeme.io API Limitations Discovered:**
❌ **No API endpoints for:**
- Reading workflows
- Reading email templates
- Reading campaigns
- Reading automation rules

✅ **What Systeme.io API CAN do:**
- Create/read/update contacts
- Manage tags
- Manage custom fields
- Trigger automations indirectly via tags

## 💡 Recommended Solution: Hybrid Architecture

Since Systeme.io doesn't expose workflow/template APIs, we'll build a **ClientFlow-native workflow builder** that stores definitions in YOUR database and uses **tags to trigger** the corresponding Systeme.io workflows.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    IB USER INTERFACE                             │
│                  (ClientFlow Dashboard)                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              VISUAL WORKFLOW BUILDER (Your DB)                   │
│  ─────────────────────────────────────────────────────────       │
│  • IBs design their workflows visually                          │
│  • IBs customize email templates                                │
│  • Stored in YOUR PostgreSQL database                           │
│  • Each IB has isolated workflow space                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   YOUR EXECUTION ENGINE                          │
│  ─────────────────────────────────────────────────────────       │
│  • Monitors workflow triggers                                    │
│  • Sends emails via Systeme.io API                              │
│  • Uses IB-specific tags for segmentation                       │
│  • Logs all activities per IB                                   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SYSTEME.IO (Hidden Backend)                     │
│  ─────────────────────────────────────────────────────────────  │
│  • Email delivery infrastructure                                 │
│  • Contact storage                                               │
│  • Tag-based segmentation                                        │
│  • Each IB gets unique tag prefix (e.g., "ib-123-")            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema for Multi-Tenant Workflows

```prisma
// File: prisma/schema.prisma

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  name              String
  role              Role      @default(USER)

  // IB/Affiliate specific
  systemeTagPrefix  String?   @unique  // e.g., "ib-abc123-"

  workflows         Workflow[]
  emailTemplates    EmailTemplate[]
  leads             Lead[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model Workflow {
  id                String    @id @default(uuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])

  name              String    // "Welcome New Lead"
  description       String?
  isActive          Boolean   @default(true)

  triggerType       TriggerType  // "LEAD_CAPTURED", "TAG_ADDED", "EMAIL_OPENED"
  triggerValue      String?      // e.g., tag name that triggers this

  steps             WorkflowStep[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId])
}

model WorkflowStep {
  id                String    @id @default(uuid())
  workflowId        String
  workflow          Workflow  @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  order             Int       // Step sequence (1, 2, 3...)
  stepType          StepType  // "SEND_EMAIL", "ADD_TAG", "WAIT", "CONDITION"

  // For SEND_EMAIL
  emailTemplateId   String?
  emailTemplate     EmailTemplate? @relation(fields: [emailTemplateId], references: [id])

  // For WAIT
  delayDays         Int?
  delayHours        Int?

  // For ADD_TAG
  tagName           String?

  // For CONDITION (if/then logic)
  conditionField    String?   // e.g., "email_opened", "monthly_leads"
  conditionOperator String?   // "equals", "greater_than", "contains"
  conditionValue    String?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([workflowId])
}

model EmailTemplate {
  id                String    @id @default(uuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])

  name              String    // "Welcome Email"
  subject           String
  bodyHtml          String    @db.Text  // Rich text HTML
  bodyText          String    @db.Text  // Plain text fallback

  previewText       String?   // Email preview snippet

  // Variables that can be used: {{first_name}}, {{company_name}}, etc.
  variables         Json?     // ["first_name", "broker_network"]

  workflowSteps     WorkflowStep[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId])
}

model Lead {
  id                String    @id @default(uuid())
  userId            String    // Which IB owns this lead
  user              User      @relation(fields: [userId], references: [id])

  email             String
  name              String
  phone             String?

  // IB-specific data
  ibType            String
  monthlyLeads      String
  brokerNetwork     String

  // Systeme.io sync
  systemeContactId  String?   @unique
  systemeTagsApplied Json?    // Array of tags applied

  // Workflow tracking
  activeWorkflows   Json?     // Array of workflow IDs they're in
  lastEmailSent     DateTime?
  emailsOpened      Int       @default(0)
  linksClicked      Int       @default(0)

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId])
  @@index([email])
}

model WorkflowExecution {
  id                String    @id @default(uuid())
  workflowId        String
  leadId            String

  currentStepOrder  Int
  status            ExecutionStatus  // "RUNNING", "COMPLETED", "PAUSED", "FAILED"

  scheduledFor      DateTime?  // When next step should run
  completedAt       DateTime?

  logs              Json?      // Execution history

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([workflowId])
  @@index([leadId])
  @@index([scheduledFor])
}

enum TriggerType {
  LEAD_CAPTURED
  TAG_ADDED
  EMAIL_OPENED
  LINK_CLICKED
  FORM_SUBMITTED
  MANUAL
}

enum StepType {
  SEND_EMAIL
  ADD_TAG
  REMOVE_TAG
  WAIT
  CONDITION
  WEBHOOK
  NOTIFICATION
}

enum ExecutionStatus {
  RUNNING
  COMPLETED
  PAUSED
  FAILED
}
```

---

## 🎨 Lightweight Visual Workflow UI

### **Minimalist Flow Builder** (Using React Flow or similar)

```svelte
<!-- File: src/routes/dashboard/workflows/+page.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';

  type Node = {
    id: string;
    type: 'trigger' | 'action' | 'condition';
    data: {
      label: string;
      config: any;
    };
    position: { x: number; y: number };
  };

  let nodes = writable<Node[]>([
    {
      id: '1',
      type: 'trigger',
      data: { label: 'New Lead Captured', config: {} },
      position: { x: 100, y: 100 }
    },
    {
      id: '2',
      type: 'action',
      data: { label: 'Send Welcome Email', config: { templateId: 'xxx' } },
      position: { x: 100, y: 250 }
    }
  ]);
</script>

<div class="workflow-builder">
  <h1>Workflow Builder</h1>

  <!-- Simplified visual representation -->
  <div class="flow-canvas">
    {#each $nodes as node}
      <div class="node node-{node.type}" style="top: {node.position.y}px; left: {node.position.x}px;">
        <div class="node-header">
          {#if node.type === 'trigger'}
            <span class="icon">⚡</span>
          {:else if node.type === 'action'}
            <span class="icon">📧</span>
          {:else}
            <span class="icon">🔀</span>
          {/if}
          <span>{node.data.label}</span>
        </div>
        <button on:click={() => editNode(node)}>Edit</button>
      </div>
    {/each}
  </div>

  <!-- Simple controls -->
  <div class="toolbar">
    <button on:click={addTrigger}>+ Trigger</button>
    <button on:click={addEmail}>+ Email</button>
    <button on:click={addDelay}>+ Delay</button>
    <button on:click={addCondition}>+ Condition</button>
  </div>
</div>

<style>
  .flow-canvas {
    position: relative;
    width: 100%;
    height: 600px;
    background: #000;
    border: 2px solid #FF5722;
  }

  .node {
    position: absolute;
    padding: 16px;
    border: 2px solid #FF5722;
    background: #000;
    color: white;
    min-width: 200px;
  }

  .node-trigger { border-color: #FF5722; }
  .node-action { border-color: #FFA500; }
  .node-condition { border-color: #00FF00; }
</style>
```

**Lightweight**: No heavy libraries, just SVG connections and simple drag-drop

---

## 📧 Email Template Editor with Systeme.io Sync

### **Strategy: Store Templates in Your DB, Send via Systeme.io**

```svelte
<!-- File: src/routes/dashboard/email-templates/[id]/+page.svelte -->
<script lang="ts">
  export let data;

  let template = data.template;
  let previewMode = false;

  async function saveTemplate() {
    // Save to YOUR database
    await fetch(`/api/email-templates/${template.id}`, {
      method: 'PUT',
      body: JSON.stringify(template)
    });

    alert('Template saved! Will be used in your workflows.');
  }
</script>

<div class="editor-container">
  <h1>Edit Email Template</h1>

  <div class="editor">
    <!-- Subject -->
    <div class="field">
      <label>Subject Line</label>
      <input bind:value={template.subject} placeholder="Welcome to ClientFlow!" />
    </div>

    <!-- Preview Text -->
    <div class="field">
      <label>Preview Text</label>
      <input bind:value={template.previewText} placeholder="Get started with your demo..." />
    </div>

    <!-- Rich Text Editor (Simple) -->
    <div class="field">
      <label>Email Body</label>
      <div class="editor-toolbar">
        <button>Bold</button>
        <button>Link</button>
        <button>Variable</button>
      </div>
      <textarea bind:value={template.bodyHtml} rows="20"></textarea>
    </div>

    <!-- Variables -->
    <div class="variables">
      <h3>Available Variables</h3>
      <button on:click={() => insertVariable('{{first_name}}')}>{{first_name}}</button>
      <button on:click={() => insertVariable('{{company_name}}')}>{{company_name}}</button>
      <button on:click={() => insertVariable('{{broker_network}}')}>{{broker_network}}</button>
    </div>

    <!-- Preview -->
    <div class="preview">
      <h3>Preview</h3>
      <div class="email-preview">
        <div class="subject"><strong>Subject:</strong> {template.subject}</div>
        <div class="body">{@html template.bodyHtml.replace(/{{first_name}}/g, 'John')}</div>
      </div>
    </div>

    <button class="save-btn" on:click={saveTemplate}>Save Template</button>
  </div>
</div>
```

### **How Email Sending Works:**

```typescript
// File: src/lib/server/workflow-engine.ts

export async function sendEmailViaSysteme(
  lead: Lead,
  template: EmailTemplate,
  ibUser: User
) {
  // 1. Replace variables in template
  const personalizedSubject = template.subject
    .replace(/{{first_name}}/g, lead.name.split(' ')[0])
    .replace(/{{broker_network}}/g, lead.brokerNetwork);

  const personalizedBody = template.bodyHtml
    .replace(/{{first_name}}/g, lead.name.split(' ')[0])
    .replace(/{{broker_network}}/g, lead.brokerNetwork);

  // 2. Send via Systeme.io API
  // Note: Systeme.io API doesn't have direct "send email" endpoint
  // So we add a tag that triggers a pre-configured workflow in Systeme.io

  const uniqueTag = `${ibUser.systemeTagPrefix}email-${template.id}`;

  await fetch('https://api.systeme.io/api/contacts', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.SYSTEME_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: lead.email,
      tags: [uniqueTag],  // This triggers the email workflow
      fields: [
        { slug: 'email_subject', value: personalizedSubject },
        { slug: 'email_body', value: personalizedBody }
      ]
    })
  });

  // 3. Log the send in your DB
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      logs: {
        push: {
          timestamp: new Date(),
          action: 'EMAIL_SENT',
          templateId: template.id,
          subject: personalizedSubject
        }
      }
    }
  });
}
```

---

## 🔐 Multi-Tenant Account Isolation Strategy

### **Problem: How to keep each IB's data separate in Systeme.io?**

### **Solution: Tag-Based Namespacing**

Each IB gets a unique prefix for ALL their tags:

```typescript
// When IB signs up:
const ibUser = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe',
    role: 'USER',
    systemeTagPrefix: `ib-${nanoid(8)}-`  // e.g., "ib-a7x3k2m1-"
  }
});

// When IB captures a lead:
await fetch('https://api.systeme.io/api/contacts', {
  method: 'POST',
  body: JSON.stringify({
    email: leadEmail,
    tags: [
      `${ibUser.systemeTagPrefix}demo-request`,      // "ib-a7x3k2m1-demo-request"
      `${ibUser.systemeTagPrefix}forex-ib`,          // "ib-a7x3k2m1-forex-ib"
      `${ibUser.systemeTagPrefix}high-volume`        // "ib-a7x3k2m1-high-volume"
    ]
  })
});
```

### **Benefits:**
✅ Complete isolation between IBs
✅ No tag conflicts
✅ Easy to query all leads for one IB: `tags LIKE 'ib-a7x3k2m1-%'`
✅ Can set up IB-specific workflows in Systeme.io by prefix

---

## 🎯 Workflow Representation UI - Lightweight Design

### **Simple Status Dashboard** (No heavy workflow editor)

```svelte
<!-- File: src/routes/dashboard/automation/+page.svelte -->
<script lang="ts">
  export let data;

  const { workflows, stats } = data;
</script>

<div class="automation-dashboard">
  <h1>Your Automation Status</h1>

  <!-- Simple visual indicators -->
  <div class="flow-overview">
    <div class="step-card active">
      <div class="step-number">1</div>
      <h3>CAPTURE</h3>
      <p>{stats.leadsThisMonth} leads this month</p>
      <span class="status">✅ Active</span>
    </div>

    <div class="arrow">→</div>

    <div class="step-card active">
      <div class="step-number">2</div>
      <h3>NURTURE</h3>
      <p>{stats.emailsSent} emails sent</p>
      <span class="status">✅ Active</span>
    </div>

    <div class="arrow">→</div>

    <div class="step-card">
      <div class="step-number">3</div>
      <h3>CONVERT</h3>
      <p>{stats.conversions} conversions</p>
      <span class="status">⏸️ Configure</span>
    </div>

    <div class="arrow">→</div>

    <div class="step-card">
      <div class="step-number">4</div>
      <h3>RETAIN</h3>
      <p>Coming soon</p>
      <span class="status">🔜 Pending</span>
    </div>
  </div>

  <!-- Your Workflows -->
  <div class="workflows-list">
    <h2>Your Workflows</h2>
    {#each workflows as workflow}
      <div class="workflow-card">
        <div class="workflow-header">
          <h3>{workflow.name}</h3>
          <span class="toggle {workflow.isActive ? 'on' : 'off'}">
            {workflow.isActive ? 'ON' : 'OFF'}
          </span>
        </div>
        <div class="workflow-steps">
          {#each workflow.steps as step, i}
            <div class="step-mini">
              {#if step.stepType === 'SEND_EMAIL'}
                📧 Send: {step.emailTemplate?.name}
              {:else if step.stepType === 'WAIT'}
                ⏰ Wait {step.delayDays} days
              {:else if step.stepType === 'ADD_TAG'}
                🏷️ Tag: {step.tagName}
              {/if}
            </div>
            {#if i < workflow.steps.length - 1}
              <span class="mini-arrow">↓</span>
            {/if}
          {/each}
        </div>
        <button>Edit Workflow</button>
      </div>
    {/each}
  </div>
</div>

<style>
  .flow-overview {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 40px;
    background: #000;
    border: 2px solid #FF5722;
    margin-bottom: 40px;
  }

  .step-card {
    flex: 1;
    padding: 20px;
    border: 2px solid #444;
    background: #111;
    text-align: center;
  }

  .step-card.active {
    border-color: #FF5722;
  }

  .arrow {
    font-size: 32px;
    color: #FF5722;
  }
</style>
```

---

## 🚀 Implementation Summary

### **What You'll Build:**

1. **Workflow Builder** (Your DB)
   - Visual flow editor (lightweight, SVG-based)
   - Store workflow definitions in PostgreSQL
   - Each IB has isolated workflows

2. **Email Template Editor** (Your DB)
   - WYSIWYG editor for IBs to customize emails
   - Variable replacement ({{first_name}}, etc.)
   - Preview mode

3. **Workflow Execution Engine** (Your Server)
   - Cron job checks for scheduled workflow steps
   - Sends emails via Systeme.io API (tag-based triggers)
   - Logs all activities per IB

4. **Multi-Tenant Isolation** (Tag Prefixes)
   - Each IB gets unique prefix: `ib-{unique_id}-`
   - All Systeme.io tags prefixed with this
   - Complete data isolation

### **What Systeme.io Provides:**

- ✅ Email delivery infrastructure
- ✅ Contact storage
- ✅ Spam compliance
- ✅ Unsubscribe handling
- ✅ Basic analytics (opens, clicks)

### **What You Control:**

- ✅ Workflow logic
- ✅ Email templates
- ✅ Execution timing
- ✅ IB isolation
- ✅ Custom analytics
- ✅ UI/UX

---

## 📊 Next Steps

1. Run database migration with new schema
2. Build simple workflow builder UI
3. Create email template editor
4. Implement workflow execution engine (cron job)
5. Add tag prefix to existing users
6. Test multi-tenant isolation

**Result**: IBs see beautiful ClientFlow automation dashboard, edit their own workflows and emails, while Systeme.io silently handles email delivery in the background! 🎉
