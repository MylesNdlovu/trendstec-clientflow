# MT5-Systeme.io Integration Dashboard

## Overview
This application serves as a data integration dashboard that connects MT5 trading data with Systeme.io workflow automation. It scrapes MT5 data using Playwright, displays it on a dashboard, and feeds relevant data to Systeme.io workflows via API and webhooks.

## Architecture Components

### 1. Data Collection Layer
- **MCP MT5 Playwright Server**: Automated web scraping of MT5 trading data
- **Location**: `/mcp-servers/mt5-playwright/`
- **Purpose**: Login to MT5 web platform and extract account data, positions, orders
- **Technology**: Node.js, Playwright, MCP Protocol

### 2. Application Layer
- **SvelteKit Application**: Main dashboard and API endpoints
- **Location**: `/src/`
- **Purpose**: Display statistics and manage data flow between MT5 and Systeme.io
- **Technology**: SvelteKit, TypeScript, Tailwind CSS

### 3. Integration Layer
- **Systeme.io API Client**: Bidirectional communication with Systeme.io
- **Webhook Endpoints**: Receive events from Systeme.io
- **Location**: `/src/routes/api/`
- **Purpose**: Sync data and trigger workflows in Systeme.io

## Data Flow

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│   MT5 Web   │    │ MCP Playwright  │    │ SvelteKit API   │    │ Systeme.io  │
│  Platform   │───▶│    Server       │───▶│   Dashboard     │───▶│ Workflows   │
│             │    │                 │    │                 │    │             │
└─────────────┘    └─────────────────┘    └─────────────────┘    └─────────────┘
                                                   ▲
                                                   │
                                          ┌─────────────────┐
                                          │ Webhook Events  │
                                          │ from Systeme.io │
                                          └─────────────────┘
```

## Key Features

### MT5 Data Scraping
- **Balance & Equity Monitoring**: Real-time account balance tracking
- **Position Management**: Monitor open positions and P&L
- **Order Tracking**: View pending orders
- **Automated Login**: Secure authentication via Playwright

### Dashboard Analytics
- **Real-time Statistics**: Live MT5 trading metrics
- **Connection Status**: Monitor MT5 and Systeme.io connectivity
- **Data Visualization**: Clean, professional charts and metrics
- **Refresh Controls**: Manual and automatic data updates

### Systeme.io Integration
- **Workflow Triggers**: Automatic workflow activation based on MT5 data
- **Contact Management**: Sync trading data to customer profiles
- **Email Campaigns**: Trigger campaigns based on trading performance
- **Webhook Processing**: Handle events from Systeme.io workflows

## API Endpoints

### MT5 Endpoints
- `GET /api/mt5/stats` - Get current MT5 account statistics
- `POST /api/mt5/refresh` - Trigger MT5 data refresh

### Systeme.io Endpoints
- `GET /api/systeme/stats` - Get Systeme.io integration statistics
- `POST /api/systeme/sync` - Sync data with Systeme.io workflows

### Webhook Endpoints
- `GET /api/webhooks/status` - Check webhook status
- `POST /api/webhooks/systeme` - Receive webhooks from Systeme.io

## Environment Variables

```bash
# Systeme.io Integration
SYSTEME_API_KEY=your_systeme_api_key
SYSTEME_PROFIT_WORKFLOW_ID=workflow_id_for_profitable_trades
SYSTEME_LOSS_WORKFLOW_ID=workflow_id_for_loss_recovery
SYSTEME_ACTIVITY_WORKFLOW_ID=workflow_id_for_high_activity

# MT5 Configuration (handled by MCP server)
MT5_USERNAME=your_mt5_username
MT5_PASSWORD=your_mt5_password
MT5_SERVER=your_mt5_server
MT5_WEB_URL=https://trade.mql5.com/trade
```

## Setup Instructions

### 1. Install MCP MT5 Server
```bash
cd mcp-servers/mt5-playwright
npm install
npm run build
npm start
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start Dashboard
```bash
npm install
npm run dev
```

### 4. Configure Systeme.io Webhooks
1. In Systeme.io, go to Settings > Integrations > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/systeme`
3. Select events: contact.created, workflow.triggered, email.sent

## Security Considerations

### Data Protection
- MT5 credentials stored securely (environment variables)
- API keys encrypted and rotated regularly
- Webhook endpoints validated with signatures
- No sensitive data logged or exposed

### Access Control
- Dashboard requires authentication
- API endpoints rate-limited
- Webhook endpoints validated
- CORS properly configured

## Monitoring & Maintenance

### Health Checks
- MT5 connection status monitoring
- Systeme.io API availability
- Webhook endpoint accessibility
- Data freshness validation

### Error Handling
- Graceful fallbacks for API failures
- Retry mechanisms for transient errors
- Comprehensive error logging
- User-friendly error messages

## Deployment

### Production Setup
1. Deploy SvelteKit app to Vercel/Netlify
2. Deploy MCP server to cloud (AWS/GCP/Azure)
3. Configure environment variables
4. Set up monitoring and logging
5. Configure Systeme.io webhooks with production URLs

### Scaling Considerations
- MCP server can be horizontally scaled
- Database can be added for persistent storage
- Queue system for high-volume webhook processing
- Caching layer for frequently accessed data

## Future Enhancements

### Planned Features
- Multi-MT5 account support
- Advanced analytics and reporting
- Custom workflow triggers
- Mobile responsive design
- Real-time WebSocket updates

### Integration Expansions
- MetaTrader 4 support
- Additional broker integrations
- CRM system connections
- Advanced email marketing platforms