# MT5 Integration Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm run setup
```

This will:
- Install all Node.js dependencies
- Push Prisma schema to database
- Build the MCP server

### 2. Start Development Server
```bash
npm run dev
```

The application will be available at http://localhost:5173

### 3. Access the Dashboard
Navigate to http://localhost:5173/dashboard to see:
- Lead statistics
- Financial metrics
- Recent activities
- MT5 scraping controls

## Manual Setup (Alternative)

If you prefer to set up each component manually:

```bash
# Install dependencies
npm install

# Setup database
npm run db:push
npm run db:generate

# Build MCP server
npm run mcp:build

# Install Playwright browsers
npx playwright install chromium

# Start dev server
npm run dev
```

## Database Setup

### Using SQLite (Default)
The project uses SQLite by default. No additional setup required.

### Using PostgreSQL (Production)
1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

3. Run migrations:
```bash
npm run db:migrate
```

## Testing the Integration

### Option 1: Using Test Script
```bash
# Create test data and run scraper
npm run scraper:test

# Test with existing credential ID
npm run scraper:test <credentialId>
```

### Option 2: Via Dashboard UI
1. Go to http://localhost:5173/dashboard
2. Click "Scrape MT5 Data" button in Quick Actions
3. View updated stats and lead information

### Option 3: Via API
```bash
# Scrape all credentials
curl -X POST http://localhost:5173/api/scraper/run \
  -H "Content-Type: application/json" \
  -d '{}'

# Scrape specific credential
curl -X POST http://localhost:5173/api/scraper/run \
  -H "Content-Type: application/json" \
  -d '{"credentialId": "clxxx123"}'
```

## Adding MT5 Credentials

### Via Prisma Studio
```bash
npm run db:studio
```

Then add a new `InvestorCredential` with:
- `login`: MT5 account number
- `password`: Investor password
- `server`: MT5 server name
- `broker`: Broker name
- `leadId`: Associated lead ID (optional)

### Via API
```bash
curl -X POST http://localhost:5173/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "broker": "Prime XBT"
  }'
```

## Available Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio GUI

### MCP Server
- `npm run mcp:build` - Build MCP server
- `npm run mcp:start` - Start MCP server manually

### Testing
- `npm run test` - Run Playwright tests
- `npm run test:headed` - Run tests with UI
- `npm run test:ui` - Open Playwright UI
- `npm run scraper:test` - Test MT5 scraper

### Type Checking
- `npm run check` - Run Svelte type checking
- `npm run check:watch` - Watch mode

## Architecture Overview

```
my-svelte-app/
├── src/
│   ├── lib/
│   │   ├── services/
│   │   │   └── mt5Scraper.ts          # MT5 scraping service
│   │   └── stores/
│   │       ├── leadsStore.ts          # Leads state management
│   │       └── theme.ts               # Theme store
│   ├── routes/
│   │   ├── api/
│   │   │   ├── leads/                 # Leads API endpoints
│   │   │   ├── scraper/               # Scraper API endpoints
│   │   │   └── stats/                 # Statistics API endpoints
│   │   └── dashboard/
│   │       ├── +page.svelte           # Main dashboard
│   │       └── leads/
│   │           └── +page.svelte       # Leads page
├── mcp-servers/
│   └── mt5-playwright/
│       ├── src/
│       │   └── index.ts               # MCP server implementation
│       └── dist/                      # Built MCP server
├── prisma/
│   ├── schema.prisma                  # Database schema
│   └── dev.db                         # SQLite database
└── scripts/
    └── test-scraper.js                # Test script
```

## Key Features

### 1. Real-time Lead Tracking
- Automatic status progression (captured → deposited → trading → qualified)
- Activity logging for all status changes
- Broker-based filtering

### 2. MT5 Data Scraping
- Automated account data extraction
- Position tracking
- Trade history
- Volume calculation
- Balance monitoring

### 3. Dashboard Analytics
- Lead conversion metrics
- Financial statistics
- Recent activities feed
- FTD/CPA earnings tracking

### 4. API Endpoints
- RESTful API for all operations
- Lead CRUD operations
- Statistics aggregation
- Scraper control

## Troubleshooting

### Database Issues
```bash
# Reset database
rm prisma/dev.db
npm run db:push
```

### MCP Server Issues
```bash
# Rebuild MCP server
cd mcp-servers/mt5-playwright
rm -rf dist node_modules
npm install
npm run build
```

### Playwright Issues
```bash
# Reinstall Playwright browsers
npx playwright install --force chromium
```

### Type Errors
```bash
# Regenerate Prisma client
npm run db:generate

# Clear SvelteKit cache
rm -rf .svelte-kit
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# Optional: MT5 Settings
MT5_WEB_URL="https://trade.mql5.com/trade"
MT5_SCRAPE_DELAY=2000

# Optional: App Settings
PUBLIC_APP_NAME="MT5 Lead Tracker"
```

## Security Notes

1. **Investor Passwords**: Should be encrypted before storing
2. **MCP Server**: Runs as separate process with limited permissions
3. **API Endpoints**: Consider adding authentication in production
4. **Database**: Use PostgreSQL with SSL in production

## Production Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Set Environment Variables
```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
```

### 3. Run Migrations
```bash
npx prisma migrate deploy
```

### 4. Start the Server
```bash
node build
```

### 5. Setup Cron Jobs (Optional)
Add to crontab for automated scraping:
```bash
# Scrape every hour
0 * * * * curl -X POST http://localhost:3000/api/scraper/run
```

## Support

For issues and questions, see:
- [MT5 Integration Guide](./MT5-INTEGRATION-GUIDE.md)
- [Scripts README](./scripts/README.md)
- [Project Structure](./PROJECT-STRUCTURE.md)
