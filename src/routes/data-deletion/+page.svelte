<script lang="ts">
	const appName = 'TrendsTec ClientFlow';
	const contactEmail = 'privacy@trendstec.com';
	const supportEmail = 'support@trendstec.com';
</script>

<svelte:head>
	<title>Data Deletion Instructions - {appName}</title>
	<meta name="description" content="How to request deletion of your data from {appName}" />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<h1 class="text-3xl font-bold mb-6">Data Deletion Instructions</h1>

	<div class="prose prose-slate max-w-none">
		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">How to Delete Your Data</h2>
			<p class="mb-4">
				At {appName}, we respect your right to control your data. You can request deletion of your data
				at any time using one of the methods below.
			</p>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">Method 1: Delete from Your Account</h2>
			<ol class="list-decimal pl-6 mb-4 space-y-2">
				<li>Log in to your {appName} account</li>
				<li>Go to <strong>Settings</strong> → <strong>Account</strong></li>
				<li>Scroll to the bottom and click <strong>"Delete My Account"</strong></li>
				<li>Confirm the deletion by entering your password</li>
				<li>Your account and all associated data will be permanently deleted within 30 days</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">Method 2: Disconnect Facebook Account</h2>
			<p class="mb-4">If you only want to remove Facebook data but keep your {appName} account:</p>
			<ol class="list-decimal pl-6 mb-4 space-y-2">
				<li>Log in to your {appName} account</li>
				<li>Go to <strong>Dashboard</strong> → <strong>Ads</strong></li>
				<li>Click <strong>"Disconnect Facebook"</strong></li>
				<li>Your Facebook access tokens and associated data will be deleted immediately</li>
			</ol>
			<p class="mb-4 mt-4">
				You can also revoke {appName}'s access from your Facebook account:
			</p>
			<ol class="list-decimal pl-6 mb-4 space-y-2">
				<li>Go to Facebook Settings → Apps and Websites</li>
				<li>Find "{appName}" in the list</li>
				<li>Click "Remove"</li>
			</ol>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">Method 3: Email Request</h2>
			<p class="mb-4">
				Send a deletion request email to <a href="mailto:{contactEmail}" class="text-blue-600 hover:underline font-semibold">{contactEmail}</a>
			</p>
			<p class="mb-4">Please include:</p>
			<ul class="list-disc pl-6 mb-4">
				<li>Your registered email address</li>
				<li>Your account name (if applicable)</li>
				<li>Subject line: "Data Deletion Request"</li>
			</ul>
			<p class="mb-4">
				We will process your request within <strong>7 business days</strong> and confirm deletion via email.
			</p>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">What Data Gets Deleted</h2>
			<p class="mb-4">When you request deletion, the following data will be permanently removed:</p>
			<ul class="list-disc pl-6 mb-4">
				<li>Your account information (name, email, profile)</li>
				<li>All lead data you've entered</li>
				<li>MT5 investor credentials</li>
				<li>Facebook access tokens and connected account data</li>
				<li>All Facebook ad campaigns you've created</li>
				<li>Ad spend history and performance metrics</li>
				<li>Commission records</li>
				<li>All activity logs associated with your account</li>
			</ul>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">Data Retention After Deletion</h2>
			<p class="mb-4">
				After deletion, we may retain certain information for legal or operational purposes:
			</p>
			<ul class="list-disc pl-6 mb-4">
				<li><strong>30 days:</strong> Backup copies are purged from our systems</li>
				<li><strong>Legal compliance:</strong> Some records may be retained if required by law (e.g., financial records for tax purposes)</li>
				<li><strong>Security logs:</strong> Anonymized security logs may be retained for system protection</li>
			</ul>
			<p class="mb-4">
				All personally identifiable information will be deleted or anonymized within 30 days.
			</p>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">Facebook Data</h2>
			<p class="mb-4">
				Regarding data obtained from Facebook:
			</p>
			<ul class="list-disc pl-6 mb-4">
				<li>Facebook access tokens are deleted immediately when you disconnect</li>
				<li>Cached Facebook data (pages, ad accounts) is deleted within 24 hours</li>
				<li>Ad performance metrics synced from Facebook are deleted with your account</li>
				<li>Note: Data in your actual Facebook account is not affected - only data stored in {appName} is deleted</li>
			</ul>
		</section>

		<section class="mb-8">
			<h2 class="text-2xl font-semibold mb-4">Questions or Issues?</h2>
			<p class="mb-4">
				If you have questions about data deletion or encounter any issues, please contact our support team:
			</p>
			<ul class="list-none mb-4">
				<li><strong>Email:</strong> <a href="mailto:{supportEmail}" class="text-blue-600 hover:underline">{supportEmail}</a></li>
				<li><strong>Privacy Inquiries:</strong> <a href="mailto:{contactEmail}" class="text-blue-600 hover:underline">{contactEmail}</a></li>
			</ul>
		</section>

		<section class="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
			<h3 class="text-xl font-semibold mb-3">Important Notes</h3>
			<ul class="list-disc pl-6 space-y-2">
				<li>Data deletion is <strong>permanent and cannot be undone</strong></li>
				<li>You will lose access to all leads, campaigns, and commission data</li>
				<li>Active ad campaigns will be paused but will remain in Facebook - you'll need to delete them from Facebook directly</li>
				<li>We recommend exporting your data before deletion if you need it for records</li>
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

	.prose p, .prose ul, .prose ol {
		color: #334155;
		line-height: 1.75;
	}

	.prose ol li {
		padding-left: 0.5rem;
	}
</style>
