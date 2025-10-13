<!-- Version Change: Initial → 1.0.0
     Modified Principles: Complete initial setup
     Added Sections: All core principles and sections
     Templates Status: ✅ Constitution created
     Follow-up TODOs: None
-->

# LeadFlow Automation Platform Constitution

## Core Principles

### I. API-First Architecture
Every feature must expose functionality through well-defined APIs before building user interfaces. All external service integrations (Mailgun, VAPI, Meta Graph API, MT5 via Playwright MCP) must be abstracted behind internal API contracts. API endpoints must support both JSON and standardized response formats. No direct external API calls from frontend components.

**Rationale**: Ensures consistent integration patterns, testability, and enables multiple frontend implementations.

### II. Workflow-Driven Development (NON-NEGOTIABLE)
All automation features must be implemented as composable workflow nodes with trigger and action panels. Each node must be independently testable, have clear input/output contracts, and support the Svelte Flow visual editor. Workflow definitions must be stored as versioned JSON schemas in PostgreSQL via Prisma. Trigger panels handle event detection (webhooks, schedules, API calls), while action panels execute operations (send emails, make API calls, update data).

**Rationale**: Core business value depends on flexible, visual workflow automation that non-technical users can modify through intuitive trigger/action panel interfaces.

### III. Real-Time State Management
All workflow executions, lead tracking, and external API responses must provide real-time updates through WebSocket connections. State changes must be immediately reflected in both the database (PostgreSQL) and active UI sessions. No polling-based status checks permitted for critical user interactions.

**Rationale**: Lead generation requires immediate feedback and status visibility for time-sensitive opportunities.

### IV. External Integration Resilience
All third-party service integrations (Mailgun, SMS, VAPI, WhatsApp, FB Messenger, IG DM, MT5 crawling) must implement circuit breaker patterns, retry logic with exponential backoff, and graceful degradation. Failed integrations must not break workflow execution. Playwright MCP server connections must handle network timeouts and DOM parsing errors.

**Rationale**: External services are unreliable; platform must remain functional when dependencies fail.

### V. Performance & Scalability Standards
Database queries must use Prisma with proper indexing for lead search operations under 100ms. Workflow execution engine must handle 1000+ concurrent workflows. Frontend components must render under 200ms. All API responses must complete under 500ms excluding external service calls. Memory usage must not exceed 512MB per workflow execution.

**Rationale**: Lead generation platforms require high responsiveness for competitive advantage.

## Technology Stack Requirements

**Backend**: Node.js with TypeScript, Express.js for API layer, Prisma ORM for PostgreSQL database access
**Frontend**: SvelteKit with TypeScript, Svelte Flow for workflow visualization, TailwindCSS for styling
**Database**: PostgreSQL with proper indexing for lead queries and workflow state storage
**External Integrations**: Mailgun SDK, VAPI SDK, Meta Graph API, SMS provider APIs
**Testing**: Vitest for unit tests, Playwright for E2E testing, Prisma for database testing
**DevOps**: Docker containers, environment-based configuration

## Security & Compliance

**API Security**: All endpoints require authentication tokens, rate limiting enforced per user/IP
**Data Privacy**: PII encryption at rest, audit logs for all lead data access, GDPR compliance for EU leads
**External API Keys**: Environment-based secret management, no hardcoded credentials, key rotation support
**Workflow Security**: User permissions for workflow editing, execution sandboxing for custom code nodes
**Database Security**: Parameterized queries only, no raw SQL execution, connection pooling with limits

## Governance

This constitution supersedes all coding practices and architectural decisions. Any deviation from these principles requires explicit documentation of:
1. Why the principle cannot be followed
2. What simpler alternative was considered and rejected
3. Migration plan back to compliance

**Amendment Process**: Changes require specification update, impact analysis, and implementation plan.
**Compliance Review**: All features must pass constitutional compliance check before merge.
**Development Guidance**: See `CLAUDE.md` for detailed Claude Code development instructions.

**Version**: 1.0.0 | **Ratified**: 2025-01-28 | **Last Amended**: 2025-01-28