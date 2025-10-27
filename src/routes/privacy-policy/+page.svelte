<script lang="ts">
	import { page } from '$app/stores';

	const appName = 'TrendsTec ClientFlow';
	const companyName = 'TrendsTec';
	const contactEmail = 'privacy@trendstec.com';
	const lastUpdated = 'October 28, 2025';
</script>

<svelte:head>
	<title>Privacy Policy - {appName}</title>
	<meta name="description" content="Privacy Policy for {appName}" />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<h1 class="text-3xl font-bold mb-6">Privacy Policy</h1>
	<p class="text-gray-600 mb-8">Last Updated: {lastUpdated}</p>

	<div class="prose prose-slate max-w-none">
		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">1. Introduction</h2>
			<p class="mb-4">
				Welcome to {appName} ("{appName}", "we", "us", or "our"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
			</p>
			<p class="mb-4">
				{appName} is a lead management and Facebook advertising platform designed for Independent Brokers (IBs) to track their trading leads and manage Facebook ad campaigns.
			</p>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">2. Information We Collect</h2>

			<h3 class="text-xl font-semibold mb-3">2.1 Information You Provide</h3>
			<ul class="list-disc pl-6 mb-4">
				<li>Account information (name, email, password)</li>
				<li>Profile information</li>
				<li>Trading lead data you enter into the system</li>
				<li>MT5 investor credentials (encrypted)</li>
			</ul>

			<h3 class="text-xl font-semibold mb-3">2.2 Facebook Data</h3>
			<p class="mb-4">When you connect your Facebook account, we collect:</p>
			<ul class="list-disc pl-6 mb-4">
				<li>Basic profile information (name, profile picture)</li>
				<li>Facebook Pages you manage (if permission granted)</li>
				<li>Facebook Business Manager data (if permission granted)</li>
				<li>Facebook Ad Account data (if permission granted)</li>
				<li>Ad campaign performance metrics</li>
			</ul>

			<h3 class="text-xl font-semibold mb-3">2.3 Automatically Collected Information</h3>
			<ul class="list-disc pl-6 mb-4">
				<li>Log data (IP address, browser type, pages visited)</li>
				<li>Device information</li>
				<li>Usage analytics</li>
			</ul>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
			<p class="mb-4">We use the collected information to:</p>
			<ul class="list-disc pl-6 mb-4">
				<li>Provide and maintain our service</li>
				<li>Manage your leads and track trading activity</li>
				<li>Connect to your Facebook account and manage ad campaigns</li>
				<li>Sync data with your Facebook Pages and Ad Accounts</li>
				<li>Track ad spend and calculate commissions</li>
				<li>Send you notifications and updates</li>
				<li>Improve our service and develop new features</li>
				<li>Comply with legal obligations</li>
			</ul>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">4. Data Security</h2>
			<p class="mb-4">We implement industry-standard security measures to protect your data:</p>
			<ul class="list-disc pl-6 mb-4">
				<li>All sensitive data is encrypted at rest using AES-256-GCM encryption</li>
				<li>Facebook access tokens are encrypted before storage</li>
				<li>MT5 credentials are encrypted before storage</li>
				<li>Secure HTTPS connections for all data transmission</li>
				<li>Regular security audits and updates</li>
			</ul>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">5. Facebook Data Usage</h2>
			<p class="mb-4">Regarding data from Facebook:</p>
			<ul class="list-disc pl-6 mb-4">
				<li>We only request permissions necessary for our service</li>
				<li>We do not sell your Facebook data to third parties</li>
				<li>We do not use your Facebook data for purposes outside this service</li>
				<li>You can disconnect your Facebook account at any time</li>
				<li>We comply with Facebook's Platform Policies</li>
			</ul>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">6. Data Sharing and Disclosure</h2>
			<p class="mb-4">We may share your information with:</p>
			<ul class="list-disc pl-6 mb-4">
				<li><strong>Service Providers:</strong> Third-party services that help us operate (hosting, analytics)</li>
				<li><strong>Facebook:</strong> When you use Facebook integration features</li>
				<li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
			</ul>
			<p class="mb-4">We do NOT sell your personal information to third parties.</p>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">7. Your Rights</h2>
			<p class="mb-4">You have the right to:</p>
			<ul class="list-disc pl-6 mb-4">
				<li>Access your personal data</li>
				<li>Correct inaccurate data</li>
				<li>Request deletion of your data</li>
				<li>Export your data</li>
				<li>Withdraw consent for data processing</li>
				<li>Disconnect your Facebook account</li>
			</ul>
			<p class="mb-4">
				To exercise these rights, please contact us at <a href="mailto:{contactEmail}" class="text-blue-600 hover:underline">{contactEmail}</a>
			</p>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">8. Data Retention</h2>
			<p class="mb-4">
				We retain your data for as long as your account is active or as needed to provide services.
				When you request deletion, we will delete your data within 30 days, except where retention
				is required by law.
			</p>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
			<p class="mb-4">
				Our service is not intended for users under 18 years of age. We do not knowingly collect
				information from children under 18.
			</p>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
			<p class="mb-4">
				Your data may be transferred to and processed in countries other than your country of residence.
				We ensure appropriate safeguards are in place to protect your data.
			</p>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
			<p class="mb-4">
				We may update this Privacy Policy from time to time. We will notify you of any changes by
				posting the new Privacy Policy on this page and updating the "Last Updated" date.
			</p>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">12. Contact Us</h2>
			<p class="mb-4">
				If you have questions about this Privacy Policy, please contact us at:
			</p>
			<ul class="list-none mb-4">
				<li><strong>Email:</strong> <a href="mailto:{contactEmail}" class="text-blue-600 hover:underline">{contactEmail}</a></li>
				<li><strong>Company:</strong> {companyName}</li>
			</ul>
		</section>
	</div>

	<div class="mt-8 pt-8 border-t">
		<a href="/dashboard" class="text-blue-600 hover:underline">&larr; Back to Dashboard</a>
	</div>
</div>

<style>
	.prose h2 {
		margin-top: 2rem;
	}

	.prose h3 {
		margin-top: 1.5rem;
	}

	.prose p, .prose ul {
		color: #334155;
		line-height: 1.75;
	}
</style>
