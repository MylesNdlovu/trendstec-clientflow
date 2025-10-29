# Facebook Lead Ads Webhook Setup Guide

This guide explains how to configure Facebook webhooks to automatically capture leads from your Lead Generation campaigns in real-time.

## Why Use Webhooks?

- **Instant lead capture**: Leads arrive in <1 second after submission
- **No polling required**: Facebook pushes data to you automatically
- **Better conversion**: Respond to hot leads immediately
- **No rate limits**: Unlike polling the API every few minutes

## Prerequisites

1. Facebook Business account with an App created
2. TrendsTec ClientFlow deployed and accessible via HTTPS
3. At least one Facebook Page connected to your account

## Step 1: Get Your Webhook URL

Your webhook URL is:
```
https://trendstec-clientflow.vercel.app/api/webhooks/facebook/leadgen
```

## Step 2: Set Environment Variables

Add these to your Vercel environment variables:

### `FACEBOOK_APP_SECRET`
1. Go to [Facebook App Dashboard](https://developers.facebook.com/apps)
2. Select your app
3. Go to **Settings** > **Basic**
4. Copy the **App Secret** (click "Show")
5. Add to Vercel: `FACEBOOK_APP_SECRET=your_app_secret_here`

### `FACEBOOK_WEBHOOK_VERIFY_TOKEN`
1. Create a random string (e.g., `trendstec_leadgen_webhook_2024`)
2. Add to Vercel: `FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_custom_token_here`
3. **Important**: Remember this token - you'll need it in Step 3

After adding env vars, redeploy your app.

## Step 3: Configure Webhook in Facebook

1. Go to [Facebook App Dashboard](https://developers.facebook.com/apps)
2. Select your app
3. Click **Add Product** (or **Products** in sidebar)
4. Find **Webhooks** and click **Set Up**

### Subscribe to Page Events

1. In Webhooks section, click **Add Subscription** under "Page"
2. Enter your webhook details:
   - **Callback URL**: `https://trendstec-clientflow.vercel.app/api/webhooks/facebook/leadgen`
   - **Verify Token**: The `FACEBOOK_WEBHOOK_VERIFY_TOKEN` you created in Step 2
3. Click **Verify and Save**
4. If verification succeeds, you'll see a green checkmark ✅

### Subscribe to leadgen Events

1. In the Page subscription section, check the box for `leadgen`
2. Click **Save**

## Step 4: Subscribe Your Page

For each Facebook Page that will run Lead Ads:

1. In Webhooks section, scroll to **Page Subscriptions**
2. Click **Subscribe to This Object**
3. Select your Facebook Page from the dropdown
4. Click **Subscribe**

## Step 5: Test the Webhook

### Option A: Use Facebook's Test Tool

1. In Webhooks section, find your subscription
2. Click **Test** button
3. Select `leadgen` event
4. Click **Send to My Server**
5. Check your server logs - you should see `[Facebook Webhook] Test event received`

### Option B: Create a Test Lead

1. Create a simple Lead Ad campaign
2. Visit the ad and submit the form
3. Check your TrendsTec dashboard - the lead should appear within 1-2 seconds

## Troubleshooting

### Verification Failed

**Error**: `403 Forbidden` during verification

**Solutions**:
- Ensure `FACEBOOK_WEBHOOK_VERIFY_TOKEN` env var matches exactly what you entered in Facebook
- Check that your webhook URL is accessible via HTTPS
- Verify you've redeployed after adding env vars

### No Leads Arriving

**Check these**:

1. **Webhook is subscribed**: In Facebook App > Webhooks, verify `leadgen` is checked
2. **Page is subscribed**: Your Facebook Page must be subscribed to the webhook
3. **Campaign uses correct ad account**: The ad account must be connected in TrendsTec
4. **Check server logs**: Look for `[Facebook Webhook]` messages in Vercel logs

### Signature Verification Failed

**Error**: `Invalid signature`

**Solution**:
- Verify `FACEBOOK_APP_SECRET` is correct
- Go to App Dashboard > Settings > Basic
- Click "Show" next to App Secret
- Copy the exact value to Vercel env vars

## How It Works

```
User fills out Lead Ad
         ↓
Facebook sends webhook notification
         ↓
TrendsTec receives notification (< 1 second)
         ↓
Fetch full lead data from Facebook
         ↓
Save lead to database
         ↓
Trigger follow-up actions (email, Systeme.io sync, etc.)
```

## Security

The webhook endpoint:
- Verifies Facebook's signature using your App Secret (HMAC SHA-256)
- Rejects requests with invalid signatures
- Only processes events from your subscribed pages
- Logs all activity for debugging

## Monitoring

Check webhook activity in Vercel logs:
```bash
vercel logs --follow
```

Look for messages starting with `[Facebook Webhook]`

## Advanced: Automatic Follow-Up

Once leads are captured, you can:
- Send instant welcome email
- Sync to Systeme.io CRM
- Send SMS via Twilio
- Trigger automated drip campaigns
- Notify sales team via Slack

All of these can be configured in the webhook handler at:
`src/routes/api/webhooks/facebook/leadgen/+server.ts`

## Support

For issues:
1. Check Vercel logs for error messages
2. Verify Facebook App permissions include `leads_retrieval`
3. Ensure you're using the same Facebook Page in ads and webhook subscription
4. Contact support with webhook logs
