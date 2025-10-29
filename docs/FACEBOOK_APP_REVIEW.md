# Facebook App Review - Submission Guide

This document contains everything you need to submit your Facebook app for `leads_retrieval` permission approval.

---

## Required Permission

**Permission**: `leads_retrieval`
**Description**: Retrieve leads from Lead Generation ads
**Why needed**: To capture leads in real-time from users' Facebook Lead Generation campaigns

---

## 1. Video Demo Script (Max 5 minutes)

### Recording Setup
- **Tool**: Loom, QuickTime, or any screen recorder
- **Duration**: 3-5 minutes
- **Resolution**: 1080p recommended
- **Audio**: Optional but helpful for narration

### Video Script

```
[SCENE 1 - Login & Dashboard] (30 seconds)
"Welcome to TrendsTec ClientFlow. This is a lead management system for forex brokers."

Action:
- Open https://trendstec-clientflow.vercel.app
- Login to dashboard
- Show main dashboard briefly

[SCENE 2 - Facebook Connection] (45 seconds)
"First, users connect their Facebook account to access their ad accounts."

Action:
- Navigate to /dashboard/ads
- Click "Connect Facebook Account" button
- Complete OAuth flow (use your real Facebook account)
- Show successful connection message
- Show that ad account info is now displayed

[SCENE 3 - Webhook Configuration] (30 seconds)
"The system is configured with webhooks to capture leads instantly."

Action:
- Navigate to /dashboard/integrations
- Scroll to "Facebook Lead Ads Webhook" section
- Show the webhook URL
- Show the setup checklist
- Briefly explain it's configured in Facebook App Dashboard

[SCENE 4 - Create Lead Generation Campaign] (1 minute)
"Users can create Lead Generation campaigns directly from our platform."

Action:
- Navigate to /dashboard/ads/campaigns
- Click "Create Campaign"
- Fill out campaign form:
  - Name: "Test Forex Lead Generation"
  - Objective: Lead Generation
  - Upload a demo image
  - Add headline: "Start Trading Forex Today"
  - Set targeting to African countries
  - Set budget: $50/day
- Click "Create Campaign"
- Show successful creation

[SCENE 5 - Submit Test Lead] (1 minute)
"When someone submits a lead form on Facebook, we capture it instantly via webhook."

Action:
- Go to Facebook Ads Manager
- Find the campaign you just created
- Click "Create Lead Form" or use existing test form
- Preview the lead form
- Fill out and submit test lead:
  - Email: test@example.com
  - Name: John Doe
  - Phone: +1234567890
- Submit the form

[SCENE 6 - Lead Appears in Dashboard] (45 seconds)
"The lead appears in our system within 1 second thanks to webhooks."

Action:
- Go back to TrendsTec dashboard
- Navigate to /dashboard/leads
- Show the lead that just appeared
- Click on the lead to show details
- Show it's linked to the correct campaign
- Show timestamp matches submission time

[SCENE 7 - Wrap Up] (30 seconds)
"This demonstrates how we use the leads_retrieval permission to provide instant lead capture for our users' Facebook campaigns. Thank you."

Action:
- Show integrations page one more time
- Highlight webhook section
- End recording
```

### Video Checklist
- ✅ Show login and authentication
- ✅ Demonstrate Facebook account connection
- ✅ Show webhook configuration
- ✅ Create a lead generation campaign
- ✅ Submit a test lead on Facebook
- ✅ Show lead appearing in system instantly
- ✅ Demonstrate it's linked to correct campaign
- ✅ Keep under 5 minutes

---

## 2. Use Case Description

Copy this into the "Detailed Description" field:

```
TrendsTec ClientFlow is a lead management and customer relationship management (CRM) platform designed specifically for forex brokers and Introducing Brokers (IBs). Our platform helps brokers capture, manage, and convert leads from Facebook Lead Generation ads.

PURPOSE:
We require the leads_retrieval permission to retrieve lead data submitted through Facebook Lead Generation ads created by our users. This enables us to provide instant lead capture and automated follow-up workflows.

HOW IT WORKS:
1. Users (forex brokers) connect their Facebook ad accounts to TrendsTec ClientFlow
2. Users create and manage Lead Generation campaigns through our platform
3. When potential traders submit lead forms on Facebook, our webhook receives a notification
4. We use the leads_retrieval API to fetch the full lead data (email, name, phone)
5. The lead is automatically saved to the user's CRM with proper attribution
6. Users can then follow up via email, SMS, or automated workflows

BUSINESS JUSTIFICATION:
Forex brokers need to respond to leads immediately - minutes matter in this industry. Our webhook-based system captures leads within 1 second of submission, enabling brokers to reach out while leads are still hot. This significantly improves conversion rates compared to manual lead retrieval.

DATA USAGE:
- Lead data (email, name, phone) is stored securely in our PostgreSQL database
- Data is only accessible to the broker who owns the campaign
- Leads are used exclusively for sales follow-up and relationship management
- We do not share, sell, or use lead data for any other purpose
- Users can delete their data at any time

SECURITY:
- Webhook requests are verified using HMAC SHA-256 signatures
- Access tokens are encrypted using AES-256-GCM
- All data transmission uses HTTPS
- We follow Facebook Platform policies and data use restrictions

USER BENEFIT:
Our platform helps small and medium-sized forex brokers compete with larger firms by providing enterprise-level lead management tools at an affordable price. Instant lead capture via webhooks is essential to this value proposition.
```

---

## 3. Platform Use Case (Dropdown Selection)

**Select**: "Lead Ads" or "Manage Leads"

---

## 4. Privacy Policy

You need a publicly accessible privacy policy. Here's a template:

### Create `/src/routes/privacy-policy/+page.svelte` (if not exists)

```svelte
<svelte:head>
	<title>Privacy Policy - TrendsTec ClientFlow</title>
</svelte:head>

<div class="min-h-screen bg-black text-white p-8">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-4xl font-bold mb-8">Privacy Policy</h1>

		<div class="space-y-6 text-gray-300">
			<section>
				<h2 class="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
				<h3 class="text-xl font-semibold text-white mb-2">Account Information</h3>
				<p>When you create an account, we collect your email address, name, and company information.</p>

				<h3 class="text-xl font-semibold text-white mb-2 mt-4">Facebook Integration</h3>
				<p>When you connect your Facebook account, we collect:</p>
				<ul class="list-disc ml-6 mt-2">
					<li>Facebook account ID and name</li>
					<li>Access tokens (encrypted and stored securely)</li>
					<li>Ad account information</li>
					<li>Lead data from your Lead Generation campaigns (email, name, phone number)</li>
				</ul>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
				<p>We use the information we collect to:</p>
				<ul class="list-disc ml-6 mt-2">
					<li>Provide and maintain our lead management services</li>
					<li>Sync leads from your Facebook campaigns to your CRM</li>
					<li>Enable you to manage and follow up with leads</li>
					<li>Improve our platform and user experience</li>
					<li>Send service-related notifications</li>
				</ul>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">3. Lead Data Usage</h2>
				<p><strong>Important:</strong> Lead data captured from your Facebook campaigns is:</p>
				<ul class="list-disc ml-6 mt-2">
					<li><strong>Your property</strong> - We act as a data processor on your behalf</li>
					<li><strong>Private</strong> - Only accessible to you and authorized users on your account</li>
					<li><strong>Never shared</strong> - We do not sell, rent, or share your leads with third parties</li>
					<li><strong>Secure</strong> - Stored in encrypted databases with industry-standard security</li>
					<li><strong>Deletable</strong> - You can delete your leads and account data at any time</li>
				</ul>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">4. Data Storage and Security</h2>
				<p>We implement industry-standard security measures:</p>
				<ul class="list-disc ml-6 mt-2">
					<li>HTTPS encryption for all data transmission</li>
					<li>AES-256-GCM encryption for stored access tokens</li>
					<li>Database encryption at rest</li>
					<li>Regular security audits and updates</li>
					<li>Access controls and authentication</li>
				</ul>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">5. Facebook Platform Compliance</h2>
				<p>Our use of Facebook data complies with:</p>
				<ul class="list-disc ml-6 mt-2">
					<li>Facebook Platform Terms</li>
					<li>Facebook Platform Policy</li>
					<li>Facebook Developer Policy</li>
				</ul>
				<p class="mt-2">We only access lead data from campaigns you explicitly authorize.</p>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
				<p>We retain your data for as long as your account is active. When you delete your account:</p>
				<ul class="list-disc ml-6 mt-2">
					<li>All lead data is permanently deleted within 30 days</li>
					<li>Facebook access tokens are immediately revoked and deleted</li>
					<li>Backup copies are purged within 90 days</li>
				</ul>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">7. Your Rights</h2>
				<p>You have the right to:</p>
				<ul class="list-disc ml-6 mt-2">
					<li>Access your data</li>
					<li>Export your data</li>
					<li>Delete your data</li>
					<li>Revoke Facebook access at any time</li>
					<li>Request data corrections</li>
				</ul>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">8. Changes to This Policy</h2>
				<p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.</p>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">9. Contact Us</h2>
				<p>If you have questions about this privacy policy, please contact us at:</p>
				<p class="mt-2">
					<strong>Email:</strong> privacy@trendstec.com<br>
					<strong>Website:</strong> https://trendstec-clientflow.vercel.app
				</p>
			</section>

			<p class="text-sm text-gray-500 mt-8">Last Updated: {new Date().toLocaleDateString()}</p>
		</div>
	</div>
</div>
```

**Privacy Policy URL**: `https://trendstec-clientflow.vercel.app/privacy-policy`

---

## 5. Terms of Service (Optional but Recommended)

**Terms URL**: `https://trendstec-clientflow.vercel.app/terms-of-service`

(You likely already have this)

---

## 6. App Icon (Required)

Facebook requires a 1024x1024px app icon. Use your TrendsTec logo.

---

## 7. Submission Checklist

Before submitting:

- ✅ Record video demo (3-5 minutes, shows complete flow)
- ✅ Write use case description (copy template above)
- ✅ Create/verify privacy policy page is live
- ✅ Verify terms of service page is live
- ✅ Upload app icon (1024x1024px)
- ✅ Test the entire flow yourself
- ✅ Ensure webhook is working in Development Mode
- ✅ Add FACEBOOK_APP_SECRET to Vercel env vars
- ✅ Add FACEBOOK_WEBHOOK_VERIFY_TOKEN to Vercel env vars

---

## 8. Step-by-Step Submission

1. **Go to Facebook App Dashboard**
   ```
   https://developers.facebook.com/apps/YOUR_APP_ID
   ```

2. **Navigate to App Review**
   - Click "App Review" in left sidebar
   - Click "Permissions and Features"

3. **Find `leads_retrieval`**
   - Search for "leads_retrieval"
   - Click "Request Advanced Access"

4. **Fill Out Form**
   - **App Name**: TrendsTec ClientFlow
   - **Email**: your@email.com
   - **Privacy Policy URL**: https://trendstec-clientflow.vercel.app/privacy-policy
   - **Terms of Service URL**: https://trendstec-clientflow.vercel.app/terms-of-service
   - **App Icon**: Upload 1024x1024px logo
   - **Use Case**: Select "Lead Ads" or "Manage Leads"
   - **Detailed Description**: Paste use case from Section 2 above
   - **Video Demonstration**: Upload your screen recording
   - **Test Instructions**: (Optional) "Use test@example.com as test user"

5. **Submit for Review**
   - Click "Submit"
   - Wait 3-7 days for review

---

## 9. After Approval

Once approved:

1. **Go to App Settings** > **Basic**
2. **Toggle "App Mode"** from "Development" to "Live"
3. **Done!** 🎉

Your app will now:
- Capture leads from ANY user (not just admins/developers)
- Work in production for all Facebook accounts
- Receive webhooks for all connected users' campaigns

---

## 10. Common Rejection Reasons & Fixes

| Reason | Fix |
|--------|-----|
| Video doesn't show complete flow | Re-record showing Facebook login → campaign creation → lead submission → lead appearing |
| Use case unclear | Be more specific about how you use lead data and why webhooks are essential |
| Privacy policy missing sections | Add sections about Facebook data usage, user rights, and data deletion |
| Can't verify webhook works | Ensure webhook verification works (GET endpoint responds correctly) |
| App not ready for review | Make sure all features work in Development Mode first |

---

## 11. FAQ

**Q: How long does review take?**
A: Usually 3-5 business days, up to 7 days maximum.

**Q: Can I still use webhooks during review?**
A: Yes! Your app works in Development Mode for admins/developers/testers.

**Q: What if I get rejected?**
A: Facebook will tell you why. Fix the issue and resubmit. Most apps get approved on second try.

**Q: Do I need to reverify periodically?**
A: No. Once approved, you're good unless Facebook changes policies.

**Q: Can I submit before the app is perfect?**
A: No. Make sure webhook works and you can demonstrate the complete flow.

---

## Need Help?

- **Facebook Support**: Use "Get Support" in App Dashboard
- **Documentation**: https://developers.facebook.com/docs/marketing-api/guides/lead-ads
- **Status Check**: Check `/dashboard/integrations` for webhook status

---

**Good luck with your submission!** 🚀
