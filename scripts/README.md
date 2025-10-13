# Scripts

## test-scraper.js

Test the MT5 scraper functionality.

### Usage

```bash
# Create test data and run scraper
node scripts/test-scraper.js

# Test with existing credential ID
node scripts/test-scraper.js <credentialId>
```

### What it does

1. Creates a test lead and investor credential (if no ID provided)
2. Calls the scraper API to trigger MT5 data extraction
3. Displays the results including:
   - Lead status
   - Account balances
   - Trading volume
   - Open positions
   - Recent activities

### Example Output

```
🚀 MT5 Scraper Test Script

Creating test lead...
✅ Test lead created: clxxx123
Creating test investor credential...
✅ Test credential created: clyyy456

Testing scraper API...
✅ Scraping completed successfully

📊 Lead Data:
Status: deposited
Credentials: 1

Credential 12345678:
  Balance: 1250.50
  Equity: 1245.30
  Margin: 150.00
  Total Volume: 2.5
  Open Positions: 3
  Total Trades: 15
  Last Scraped: 2024-01-30T12:00:00.000Z
  Scraping Status: success

📝 Recent Activities:
  deposit: Lead deposited $1250.50 (2024-01-30T12:00:00.000Z)
  status_change: Status changed from captured to deposited (2024-01-30T12:00:00.000Z)

✨ Test complete!
Lead ID: clxxx123
Credential ID: clyyy456
```

## Notes

- The test script uses mock credentials by default
- To test with real MT5 credentials, update the `login` and `password` in the `createTestCredential` function
- Make sure the dev server is running on http://localhost:5173 before running the test
