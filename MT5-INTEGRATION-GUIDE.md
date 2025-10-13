# MT5 Integration Guide

## Overview
This document describes the MT5 scraping integration with Playwright MCP and real-time lead tracking system.

## Architecture

### 1. Playwright MCP Server (`mcp-servers/mt5-playwright/`)
- **Purpose**: Scrapes MT5 web platform data using Playwright with stealth mode
- **Location**: `mcp-servers/mt5-playwright/src/index.ts`
- **Features**:
  - MT5 login automation
  - Account data extraction (balance, equity, margin, etc.)
  - Position tracking
  - Order monitoring
  - Stealth mode to avoid detection

#### Available MCP Tools:
- `mt5_login`: Login to MT5 web platform
- `mt5_get_account_data`: Get current account information
- `mt5_get_positions`: Get all open positions
- `mt5_get_orders`: Get pending orders
- `mt5_logout`: Logout and cleanup

### 2. Database Schema (Prisma)

#### New/Updated Models:
**InvestorCredential** (Updated):
- Added trading data fields: `balance`, `equity`, `margin`, `freeMargin`, `marginLevel`, `profit`
- Added scraping metadata: `lastScrapedAt`, `scrapingStatus`, `scrapingError`
- Volume tracking: `totalVolume`, `meetsMinVolume`

**MT5Position** (New):
- Tracks open and closed positions
- Fields: `ticket`, `symbol`, `type`, `volume`, `openPrice`, `currentPrice`, `profit`
- Linked to InvestorCredential

**MT5Trade** (New):
- Tracks completed trades
- Fields: `ticket`, `symbol`, `type`, `volume`, `openPrice`, `closePrice`, `profit`, `commission`, `swap`
- Linked to InvestorCredential

**LeadActivity** (New):
- Tracks all lead status changes and activities
- Fields: `type`, `description`, `metadata`, `amount`
- Activity types: `status_change`, `deposit`, `trade`, `qualification`

**Lead** (Updated):
- Added relationship to `LeadActivity`

### 3. MT5 Scraper Service (`src/lib/services/mt5Scraper.ts`)

#### Key Features:
- **scrapeAccountData(credentialId)**: Scrapes MT5 data for a specific credential
  - Calls MCP server tools to login and extract data
  - Updates database with account info and positions
  - Automatically updates lead status based on activity

- **scrapeAllCredentials()**: Scrapes all unverified credentials
  - Iterates through all credentials
  - Adds delay between scrapes to avoid detection
  - Returns success/failure statistics

- **Auto Lead Status Updates**:
  - `captured` → `deposited`: When balance > 0
  - `deposited` → `trading`: When has open positions
  - `trading` → `qualified`: When total volume >= 0.2 lots

### 4. API Endpoints

#### `/api/leads` (GET, POST)
- **GET**: Fetch all leads with stats (supports filtering by status/broker)
- **POST**: Create a new lead

#### `/api/leads/[id]` (GET, PATCH, DELETE)
- **GET**: Get specific lead with full details
- **PATCH**: Update lead information
- **DELETE**: Delete a lead

#### `/api/stats` (GET)
- Get comprehensive dashboard statistics:
  - Lead counts by status
  - Financial metrics (balance, equity, profit, volume)
  - Conversion rates
  - Recent activities
  - Leads per broker

#### `/api/scraper/run` (POST)
- Trigger MT5 scraping
- Parameters: `{ credentialId?: string }` (optional, scrapes all if not provided)
- Returns scraping results

### 5. Frontend Pages

#### Dashboard (`/dashboard/+page.svelte`)
**Features**:
- Real-time stats display
- Lead status overview (captured, deposited, trading, qualified)
- Financial metrics (balance, equity, profit, volume)
- Conversion flow visualization
- Recent activities feed
- FTD/CPA earnings breakdown
- Quick action buttons including "Scrape MT5 Data"

**Data Flow**:
- Fetches from `/api/stats` on load
- Auto-refreshes via "Refresh Data" button
- Manual scrape trigger via "Scrape MT5 Data" button

#### Leads Page (`/dashboard/leads/+page.svelte`)
**Features**:
- Comprehensive lead table
- Search and filter by status/broker
- Stats summary cards
- Lead details including:
  - Status badges with color coding
  - Balance and equity
  - Trading volume
  - Open positions count
  - Created date
- Link to individual lead view

### 6. Leads Store (`src/lib/stores/leadsStore.ts`)

**Purpose**: Centralized state management for leads and stats

**Methods**:
- `fetchLeads(filters?)`: Fetch all leads with optional filters
- `fetchStats()`: Fetch dashboard statistics
- `createLead(leadData)`: Create new lead
- `updateLead(id, updates)`: Update existing lead
- `triggerScraping(credentialId?)`: Trigger MT5 scraping
- `startAutoRefresh(intervalMs)`: Enable auto-refresh
- `stopAutoRefresh()`: Disable auto-refresh
- `clear()`: Clear all data

**Stores**:
- `leads`: Array of all leads
- `stats`: Dashboard statistics
- `loading`: Loading state
- `error`: Error messages

## Usage Guide

### 1. Setting Up MT5 Credentials
```typescript
// Add investor credential for a lead
const credential = await prisma.investorCredential.create({
  data: {
    leadId: leadId,
    login: "12345678",
    password: "investorPassword",
    server: "MT5Server-Live",
    broker: "Prime XBT"
  }
});
```

### 2. Triggering Scraping

#### From Dashboard UI:
- Click "Scrape MT5 Data" button in Quick Actions section
- Automatically refreshes data after completion

#### From API:
```bash
# Scrape all credentials
curl -X POST http://localhost:5173/api/scraper/run \
  -H "Content-Type: application/json" \
  -d '{}'

# Scrape specific credential
curl -X POST http://localhost:5173/api/scraper/run \
  -H "Content-Type: application/json" \
  -d '{"credentialId": "credential_id_here"}'
```

#### Programmatically:
```typescript
import { mt5Scraper } from '$lib/services/mt5Scraper';

// Scrape specific credential
const result = await mt5Scraper.scrapeAccountData(credentialId);

// Scrape all credentials
const results = await mt5Scraper.scrapeAllCredentials();
```

### 3. Using the Leads Store
```svelte
<script>
  import { leadsStore } from '$lib/stores/leadsStore';
  import { onMount, onDestroy } from 'svelte';

  onMount(async () => {
    // Fetch initial data
    await leadsStore.fetchLeads();
    await leadsStore.fetchStats();

    // Enable auto-refresh every 60 seconds
    leadsStore.startAutoRefresh(60000);
  });

  onDestroy(() => {
    // Clean up on component destroy
    leadsStore.stopAutoRefresh();
  });

  // Trigger scraping
  async function handleScrape() {
    await leadsStore.triggerScraping();
  }
</script>

<div>
  {#if $leadsStore.loading}
    <p>Loading...</p>
  {/if}

  {#if $leadsStore.error}
    <p>Error: {$leadsStore.error}</p>
  {/if}

  {#each $leadsStore.leads as lead}
    <div>{lead.email} - {lead.status}</div>
  {/each}

  <button on:click={handleScrape}>Scrape MT5 Data</button>
</div>
```

## Data Flow

```
1. User submits MT5 investor credentials
   ↓
2. Credentials stored in database (InvestorCredential)
   ↓
3. Scraping triggered (manual or scheduled)
   ↓
4. MT5 Scraper Service calls MCP Server
   ↓
5. Playwright MCP Server:
   - Launches browser with stealth mode
   - Logs into MT5 web platform
   - Extracts account data and positions
   - Returns data to scraper service
   ↓
6. Scraper Service:
   - Updates InvestorCredential with account data
   - Creates/updates MT5Position records
   - Calculates total volume
   - Updates lead status if criteria met
   - Creates LeadActivity records for changes
   ↓
7. Dashboard/Leads pages refresh and display updated data
```

## Lead Status Progression

1. **Captured**: Lead information captured, no deposit yet
2. **Deposited**: Lead has made a deposit (balance > 0)
3. **Trading**: Lead has started trading (has open positions or volume > 0)
4. **Qualified**: Lead meets minimum volume requirement (≥ 0.2 lots)

## Commission Tracking

### FTD (First Time Deposit):
- Earned when lead status changes to "deposited"
- Configured in dashboard settings (default: $250)

### CPA (Cost Per Acquisition):
- Earned when lead becomes "qualified" (≥ 0.2 lots)
- Configured in dashboard settings (default: $300)

## Security Considerations

1. **Investor Passwords**: Should be encrypted before storing in database
2. **MCP Server**: Runs as separate process, communicates via stdio
3. **Stealth Mode**: Playwright uses stealth plugin to avoid bot detection
4. **Rate Limiting**: 2-second delay between credential scrapes

## Troubleshooting

### Scraping Fails
1. Check MT5 web platform URL is correct
2. Verify credentials are valid
3. Check if MT5 web interface selectors changed
4. Review scraping error logs in `scrapingError` field

### Data Not Updating
1. Verify scraping was successful
2. Check database for updated `lastScrapedAt`
3. Refresh dashboard/leads page
4. Check browser console for API errors

### MCP Server Issues
1. Build MCP server: `cd mcp-servers/mt5-playwright && npm run build`
2. Test manually: `node dist/index.js`
3. Check Playwright installation: `npx playwright install chromium`

## Future Enhancements

1. **Scheduled Scraping**: Add cron jobs for automatic scraping
2. **WebSocket Updates**: Real-time updates without polling
3. **Email Notifications**: Alert on status changes
4. **Trade History**: Full trade history analysis
5. **Performance Analytics**: Lead conversion funnel analytics
6. **Multi-Broker Support**: Custom scraping logic per broker
7. **2FA Support**: Handle two-factor authentication
8. **Error Recovery**: Automatic retry logic for failed scrapes
