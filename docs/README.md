# TrendsTec ClientFlow Documentation

> Lead management and Facebook advertising platform for Independent Brokers (IBs)

## 📚 Documentation Index

- **[DATABASE.md](./DATABASE.md)** - Complete database schema and relationships
- **[API.md](./API.md)** - All API endpoints and contracts
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and key decisions
- **[FEATURES.md](./FEATURES.md)** - Feature specifications and roadmap
- **[FACEBOOK_INTEGRATION.md](./FACEBOOK_INTEGRATION.md)** - Facebook OAuth and Ads API integration

## 🚀 Quick Start

1. **Database Setup**: See [DATABASE.md](./DATABASE.md) for schema
2. **Environment Variables**: See [ARCHITECTURE.md](./ARCHITECTURE.md#environment-variables)
3. **Facebook Setup**: See [FACEBOOK_INTEGRATION.md](./FACEBOOK_INTEGRATION.md)

## 🏗️ System Overview

TrendsTec ClientFlow is a SvelteKit application that helps Independent Brokers:
- Manage trading leads and track conversions
- Run Facebook ad campaigns with pre-built templates
- Track MT5 investor credentials and trading volume
- Calculate and manage commission earnings
- Automate lead follow-ups via Systeme.io integration

## 🔑 Key Technologies

- **Frontend**: SvelteKit, TailwindCSS, Lucide Icons
- **Backend**: SvelteKit API routes, Prisma ORM
- **Database**: PostgreSQL (via Vercel Postgres)
- **Hosting**: Vercel
- **Integrations**: Facebook Marketing API, Systeme.io, MT5

## 📋 Current Status

### ✅ Completed Features
- User authentication (JWT-based)
- Lead management system
- MT5 credential tracking
- Facebook OAuth integration (Tier 0-3 detection)
- Legal pages (Privacy Policy, Terms, Data Deletion)
- Commission tracking framework

### 🚧 In Progress
- Ad Templates System
- Campaign Creation Flow
- Facebook Ads API integration

### 📅 Roadmap
- Real-time campaign performance tracking
- AI-powered ad optimization
- Advanced lead scoring
- Multi-language support

## 🔐 Security

- All sensitive data encrypted at rest (AES-256-GCM)
- JWT-based authentication
- Environment variables for secrets
- HTTPS-only in production

## 📞 Support

For questions or issues, see [ARCHITECTURE.md](./ARCHITECTURE.md#troubleshooting)

---

**Last Updated**: October 28, 2025
**Version**: 1.0.0
