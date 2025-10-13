# Testing Guide

## Overview

This project uses **Playwright** for E2E testing with automatic **spec-to-test synchronization** to ensure all functional requirements are covered.

## 🎯 Philosophy

- **Spec-Driven Testing**: Every acceptance scenario in `specs/*/spec.md` automatically generates a corresponding Playwright test
- **Always in Sync**: Tests are regenerated before each test run via `pretest` hook
- **Coverage Tracking**: Continuous validation of test coverage against specifications
- **Supreme Logic**: Multi-browser, mobile-friendly, CI/CD ready

## 📁 Structure

```
tests/
  └── e2e/                           # Playwright E2E tests
      └── {feature-name}.spec.ts     # Auto-generated from specs
specs/
  └── {feature-number}-{name}/
      └── spec.md                    # Feature specifications
.specify/
  └── scripts/
      ├── sync-specs-to-tests.js     # Spec→Test sync engine
      └── validate-spec-coverage.js  # Coverage validator
```

## 🚀 Commands

### Running Tests

```bash
# Run all tests (auto-syncs specs first)
npm test

# Run with UI mode for debugging
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug mode with step-through
npm run test:debug

# Browser-specific tests
npm run test:chromium
npm run test:firefox
npm run test:webkit
npm run test:mobile

# View test report
npm run test:report

# Generate tests with Codegen
npm run test:codegen
```

### Spec Management

```bash
# Sync specs to tests manually
npm run spec:sync

# Validate spec coverage
npm run spec:validate
```

## 🔄 Workflow

### 1. **Write Specification**
Create acceptance scenarios in `specs/{feature}/spec.md`:

```markdown
### Acceptance Scenarios
1. **Given** I'm a new user, **When** I sign up, **Then** I should see the dashboard
```

### 2. **Auto-Generate Tests**
Run sync (happens automatically before tests):

```bash
npm run spec:sync
```

Generates `tests/e2e/{feature}.spec.ts` with scaffolded tests.

### 3. **Implement Tests**
Remove `test.skip()` and add Playwright assertions:

```typescript
test('Sign up', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'SecurePass123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});
```

### 4. **Validate Coverage**
Check that all scenarios are tested:

```bash
npm run spec:validate
```

## 📊 Coverage Requirements

- **CI Threshold**: 80% scenario coverage required
- **Coverage Calculation**: (Implemented Tests / Total Scenarios) × 100
- **Skipped Tests**: Not counted toward coverage

## 🎨 Test Patterns

### Page Object Model

```typescript
class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}
```

### Fixtures

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Setup common state
});
```

### API Mocking

```typescript
test('Shows offline message', async ({ page }) => {
  await page.route('**/api/**', route =>
    route.abort('failed')
  );
  await page.goto('/');
  await expect(page.locator('.offline-banner')).toBeVisible();
});
```

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)

- **Base URL**: `http://localhost:5173`
- **Test Timeout**: 60 seconds
- **Retries**: 2 in CI, 0 locally
- **Workers**: 1 in CI, auto locally
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome/Safari

### Environment Variables

```bash
BASE_URL=http://localhost:3000  # Override default URL
CI=true                         # Enable CI optimizations
```

## 🚨 CI/CD Integration

### GitHub Actions (`.github/workflows/test.yml`)

Automatically runs on:
- Push to `main` or `develop`
- Pull requests

Steps:
1. Install dependencies
2. Setup database
3. Sync specs to tests
4. Run Playwright tests
5. Upload test results and reports
6. Validate spec coverage

### Artifacts

- **Test Results**: JSON/JUnit reports
- **HTML Report**: Visual test report
- **Screenshots/Videos**: Failure debugging

## 💡 Best Practices

1. **Keep Tests Independent**: Each test should set up its own state
2. **Use Data Attributes**: Add `data-testid` for stable selectors
3. **Avoid Hard Waits**: Use `waitFor` instead of `setTimeout`
4. **Test User Flows**: Focus on complete user journeys
5. **Mock External Services**: Use `page.route()` for API mocking
6. **Parallel-Safe**: Tests should work in parallel without interference

## 🐛 Debugging

### VS Code Integration

Install Playwright extension for:
- Test discovery
- Inline test running
- Debug breakpoints
- Time-travel debugging

### Debug Mode

```bash
npm run test:debug
```

Opens Playwright Inspector with step-through debugging.

### Trace Viewer

```bash
npx playwright show-trace test-results/trace.zip
```

View execution timeline, network requests, and DOM snapshots.

## 📈 Monitoring

### Test Reports

After running tests:

```bash
npm run test:report
```

Opens HTML report showing:
- Pass/fail rates
- Test duration
- Screenshots/videos
- Error stack traces

### Coverage Dashboard

```bash
npm run spec:validate
```

Shows:
- Feature-level coverage
- Missing test scenarios
- Implementation status

## 🔐 Database & State

Tests use isolated database:
- Fresh migrations before test suite
- Transaction rollback per test (optional)
- Seed data in `beforeEach` hooks

## 🌐 Multi-Environment

```bash
# Local development
npm test

# Staging environment
BASE_URL=https://staging.app.com npm test

# Production smoke tests
BASE_URL=https://app.com npm run test:smoke
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

---

**Happy Testing!** 🎭
