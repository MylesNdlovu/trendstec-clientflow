# MT5-Systeme.io Integration Dashboard

A powerful integration platform that connects MT5 trading data with Systeme.io workflow automation. Monitor your trading performance and automatically trigger marketing workflows based on trading activities.

## 🚀 Features

### 📊 Real-time MT5 Monitoring
- **Live Account Data**: Balance, equity, profit/loss tracking
- **Position Management**: Monitor open positions and orders
- **Automated Data Collection**: Playwright-powered web scraping
- **Connection Status**: Real-time connectivity monitoring

### 🔗 Systeme.io Integration
- **Workflow Automation**: Trigger campaigns based on trading performance
- **Contact Synchronization**: Update customer data with trading metrics
- **Webhook Processing**: Bidirectional communication with Systeme.io
- **Smart Triggers**: Automated actions for profitable/loss scenarios

### 📈 Professional Dashboard
- **Clean Interface**: Modern, responsive design
- **Real-time Updates**: 30-second refresh intervals
- **Connection Monitoring**: Visual status indicators
- **Data Flow Visualization**: Clear integration overview

## 🛠 Quick Start

### Prerequisites
- Node.js 18+
- Systeme.io account with API access
- MT5 trading account with web access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-svelte-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd mcp-servers/mt5-playwright
   npm install
   cd ../..
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```bash
   # Systeme.io Configuration
   SYSTEME_API_KEY=your_systeme_api_key
   SYSTEME_PROFIT_WORKFLOW_ID=workflow_id_for_profitable_trades
   SYSTEME_LOSS_WORKFLOW_ID=workflow_id_for_loss_recovery
   SYSTEME_ACTIVITY_WORKFLOW_ID=workflow_id_for_high_activity

   # MT5 Configuration
   MT5_USERNAME=your_mt5_username
   MT5_PASSWORD=your_mt5_password
   MT5_SERVER=your_mt5_server
   ```

4. **Start the MCP MT5 Server**
   ```bash
   cd mcp-servers/mt5-playwright
   npm run build
   npm start
   ```

5. **Start the dashboard**
   ```bash
   npm run dev
   ```

6. **Access the dashboard**
   Open `http://localhost:5173/dashboard/automations`

## 🔧 Configuration

### Systeme.io Setup

1. **Get API Key**
   - Go to Systeme.io Settings > Integrations > API
   - Generate a new API key
   - Add to your `.env` file

2. **Create Workflows**
   - Set up workflows in Systeme.io for different trading scenarios
   - Note the workflow IDs for your `.env` file

3. **Configure Webhooks**
   - In Systeme.io: Settings > Integrations > Webhooks
   - Add webhook URL: `https://yourdomain.com/api/webhooks/systeme`
   - Select events: `contact.created`, `workflow.triggered`, `email.sent`

### MT5 Configuration

1. **Web Platform Access**
   - Ensure your MT5 account has web platform access
   - Test login at your broker's web trading platform

2. **Credentials**
   - Add your MT5 login credentials to `.env`
   - Server name should match your broker's server

## 📚 API Reference

### MT5 Endpoints

- `GET /api/mt5/stats` - Current account statistics
- `POST /api/mt5/refresh` - Trigger data refresh

### Systeme.io Endpoints

- `GET /api/systeme/stats` - Integration statistics
- `POST /api/systeme/sync` - Sync data with workflows

### Webhook Endpoints

- `GET /api/webhooks/status` - Webhook status check
- `POST /api/webhooks/systeme` - Receive Systeme.io events

## 🔄 Data Flow

```
MT5 Web Platform → MCP Playwright Server → Dashboard API → Systeme.io Workflows
                                               ↑
                                        Webhook Events
```

1. **Data Collection**: MCP server scrapes MT5 data via Playwright
2. **Processing**: Dashboard processes and displays data
3. **Integration**: Relevant data synced to Systeme.io
4. **Automation**: Workflows triggered based on trading performance
5. **Feedback**: Webhook events update dashboard status

## 🚦 Workflow Triggers

### Automatic Triggers
- **Profitable Campaign**: Triggered when profit > $1000
- **Loss Recovery**: Triggered when loss < -$500
- **High Activity Alert**: Triggered when positions > 5

### Manual Sync
- Use "Sync with Systeme.io" button for manual synchronization
- Custom data can be sent via API endpoints

## 📊 Monitoring

### Connection Status
- **Green**: Connected and operational
- **Red**: Connection failed or offline
- **Yellow**: Partial connectivity or warning

### Data Freshness
- Last updated timestamps shown for all data
- Automatic refresh every 30 seconds
- Manual refresh available

## 🛡️ Security

### Best Practices
- Store credentials in environment variables
- Use HTTPS in production
- Validate webhook signatures
- Rotate API keys regularly

### Data Protection
- No sensitive data logged
- Credentials encrypted at rest
- API rate limiting enabled
- CORS properly configured

## 📦 Deployment

### Production Deployment

1. **Deploy Dashboard**
   ```bash
   npm run build
   # Deploy to Vercel, Netlify, or your preferred platform
   ```

2. **Deploy MCP Server**
   - Deploy to cloud provider (AWS, GCP, Azure)
   - Ensure Playwright dependencies installed
   - Configure environment variables

3. **Update Webhooks**
   - Update Systeme.io webhook URLs to production
   - Test webhook connectivity

### Environment Variables
Set these in your production environment:
- All `.env` variables
- Additional production-specific configs

## 🐛 Troubleshooting

### Common Issues

**MT5 Connection Failed**
- Verify credentials in `.env`
- Check MT5 web platform accessibility
- Ensure MCP server is running

**Systeme.io API Errors**
- Verify API key validity
- Check workflow IDs exist
- Confirm API rate limits not exceeded

**Webhook Not Working**
- Verify webhook URL accessibility
- Check Systeme.io webhook configuration
- Review webhook event logs

### Debug Mode
Enable detailed logging:
```bash
DEBUG=* npm run dev
```

## 📈 Monitoring & Analytics

### Key Metrics
- MT5 connection uptime
- API response times
- Webhook delivery success rate
- Data freshness intervals

### Logging
- All API calls logged
- Error tracking enabled
- Performance metrics collected
- User activity monitored

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Check the [troubleshooting section](#-troubleshooting)
- Review the [architecture documentation](./ARCHITECTURE.md)
- Create an issue for bug reports
- Contact support for enterprise features

---

**Built with ❤️ using SvelteKit, Playwright, and Systeme.io**
