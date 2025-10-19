# Mailgun Email Setup Guide

This guide will help you set up Mailgun for email verification and password reset functionality.

## 1. Create a Mailgun Account

1. Go to [https://www.mailgun.com/](https://www.mailgun.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

## 2. Get Your API Credentials

### Option A: Using Mailgun Sandbox (Free - For Testing)

1. Log in to your Mailgun dashboard
2. Go to **Sending** → **Overview**
3. Find your **Sandbox domain** (looks like `sandboxXXXXXXXX.mailgun.org`)
4. Copy your **API Key** from the **API Keys** section
5. Add authorized recipients (emails you want to test with):
   - Go to **Sending** → **Overview**
   - Under "Authorized Recipients", add your test email addresses
   - Verify each email address

### Option B: Using Custom Domain (Production)

1. Log in to your Mailgun dashboard
2. Go to **Sending** → **Domains** → **Add New Domain**
3. Enter your domain (e.g., `mg.yourdomain.com`)
4. Follow DNS setup instructions to verify your domain:
   - Add TXT records for SPF and DKIM
   - Add CNAME record for tracking
   - Add MX records (optional, for receiving emails)
5. Wait for DNS propagation (can take up to 48 hours)
6. Once verified, copy your **API Key** from Settings

## 3. Configure Environment Variables

Update your `.env` file with your Mailgun credentials:

```bash
# Mailgun Email Configuration
MAILGUN_API_KEY="your-actual-api-key-here"
MAILGUN_DOMAIN="sandboxXXXXXXXX.mailgun.org"  # or your custom domain
MAILGUN_FROM_EMAIL="noreply@sandboxXXXXXXXX.mailgun.org"  # or noreply@yourdomain.com
MAILGUN_APP_NAME="ClientFlow"
```

### For Vercel Production:

Add the same environment variables to your Vercel project:

```bash
vercel env add MAILGUN_API_KEY production
vercel env add MAILGUN_DOMAIN production
vercel env add MAILGUN_FROM_EMAIL production
vercel env add MAILGUN_APP_NAME production
```

Or add them via the Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add each variable with the production scope

## 4. Test Email Functionality

### Test Email Verification:

1. Sign up for a new account at `/signup`
2. Check the server console logs for the verification link (if using sandbox)
3. Click the verification link in your email
4. Verify you're redirected to login with success message

### Test Password Reset:

1. Go to `/forgot-password`
2. Enter your email address
3. Check your email for the password reset link
4. Click the link and set a new password
5. Log in with your new password

## 5. Email Templates

The application sends 3 types of emails:

1. **Email Verification** - Sent when user signs up
2. **Password Reset** - Sent when user requests password reset
3. **Welcome Email** - Sent after email verification

All email templates are defined in: `src/lib/server/email/mailgun.ts`

## 6. Troubleshooting

### Emails Not Sending?

1. **Check API credentials** - Make sure your API key and domain are correct
2. **Check authorized recipients** - If using sandbox, recipient must be authorized
3. **Check server logs** - Look for error messages in console
4. **Verify DNS records** - For custom domains, ensure all DNS records are set correctly
5. **Check Mailgun dashboard** - View logs in Mailgun dashboard under Sending → Logs

### Common Error Messages:

- `MAILGUN_API_KEY environment variable is not set` - Add API key to `.env`
- `Forbidden` - Check if recipient is authorized (sandbox mode)
- `Domain not found` - Verify domain is correctly configured
- `Invalid API key` - Double-check your API key is correct

## 7. Mailgun Free Tier Limits

- **5,000 emails/month** for first 3 months (free trial)
- **100 emails/day** after trial ends
- **Authorized recipients only** in sandbox mode (max 5)

For production use with unlimited recipients, you'll need to:
1. Add a custom domain
2. Verify the domain
3. Add payment information to upgrade

## 8. Alternative Email Services

If you prefer a different email service, you can modify `src/lib/server/email/mailgun.ts` to use:

- **Resend** - Modern email API (free tier: 100 emails/day)
- **SendGrid** - Popular choice (free tier: 100 emails/day)
- **Postmark** - Transactional emails (free tier: 100 emails/month)
- **Amazon SES** - AWS email service (very cheap, complex setup)

## Support

For Mailgun-specific issues, contact Mailgun support at:
- Documentation: https://documentation.mailgun.com/
- Support: https://www.mailgun.com/support/
