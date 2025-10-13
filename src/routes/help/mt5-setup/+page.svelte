<script lang="ts">
	let activeSection = 'overview';

	function setActiveSection(section: string) {
		activeSection = section;
	}
</script>

<svelte:head>
	<title>MT5 Setup Guide - Find Your Credentials</title>
	<meta name="description" content="Learn how to find your MT5 login number, server name, and investor password for account verification" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white shadow">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="py-6">
				<h1 class="text-3xl font-bold text-gray-900">MT5 Setup Guide</h1>
				<p class="mt-2 text-gray-600">
					Learn how to find your MT5 credentials for account verification
				</p>
			</div>
		</div>
	</div>

	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
			<!-- Navigation -->
			<nav class="lg:col-span-1">
				<div class="bg-white rounded-lg shadow p-4 sticky top-8">
					<h3 class="font-medium text-gray-900 mb-4">Quick Navigation</h3>
					<ul class="space-y-2">
						<li>
							<button
								on:click={() => setActiveSection('overview')}
								class="w-full text-left px-3 py-2 rounded-md text-sm {activeSection === 'overview' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
							>
								📋 Overview
							</button>
						</li>
						<li>
							<button
								on:click={() => setActiveSection('login')}
								class="w-full text-left px-3 py-2 rounded-md text-sm {activeSection === 'login' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
							>
								🔢 MT5 Login Number
							</button>
						</li>
						<li>
							<button
								on:click={() => setActiveSection('server')}
								class="w-full text-left px-3 py-2 rounded-md text-sm {activeSection === 'server' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
							>
								🌐 Server Name
							</button>
						</li>
						<li>
							<button
								on:click={() => setActiveSection('investor')}
								class="w-full text-left px-3 py-2 rounded-md text-sm {activeSection === 'investor' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
							>
								🔐 Investor Password
							</button>
						</li>
						<li>
							<button
								on:click={() => setActiveSection('troubleshooting')}
								class="w-full text-left px-3 py-2 rounded-md text-sm {activeSection === 'troubleshooting' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
							>
								🔧 Troubleshooting
							</button>
						</li>
					</ul>
				</div>
			</nav>

			<!-- Content -->
			<div class="lg:col-span-3">
				<div class="bg-white rounded-lg shadow p-8">
					<!-- Overview Section -->
					{#if activeSection === 'overview'}
						<h2 class="text-2xl font-bold text-gray-900 mb-6">📋 What You Need</h2>

						<div class="prose max-w-none">
							<p class="text-lg text-gray-600 mb-6">
								To verify your MT5 trading account, we need three pieces of information:
							</p>

							<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
								<div class="border border-gray-200 rounded-lg p-4">
									<div class="text-2xl mb-2">🔢</div>
									<h3 class="font-semibold text-gray-900 mb-2">MT5 Login Number</h3>
									<p class="text-sm text-gray-600">Your unique account number (6-12 digits)</p>
								</div>
								<div class="border border-gray-200 rounded-lg p-4">
									<div class="text-2xl mb-2">🌐</div>
									<h3 class="font-semibold text-gray-900 mb-2">Server Name</h3>
									<p class="text-sm text-gray-600">Your broker's MT5 server address</p>
								</div>
								<div class="border border-gray-200 rounded-lg p-4">
									<div class="text-2xl mb-2">🔐</div>
									<h3 class="font-semibold text-gray-900 mb-2">Investor Password</h3>
									<p class="text-sm text-gray-600">Read-only access password (optional but recommended)</p>
								</div>
							</div>

							<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
								<h4 class="font-semibold text-blue-900 mb-2">🔒 Security Notice</h4>
								<p class="text-blue-800 text-sm">
									We only use investor passwords, which provide read-only access to your account.
									Never share your main trading password with anyone.
								</p>
							</div>

							<h3 class="text-lg font-semibold text-gray-900 mb-4">Why We Need This Information</h3>
							<ul class="list-disc pl-6 space-y-2 text-gray-600">
								<li>Verify that you have successfully opened and funded your trading account</li>
								<li>Track your deposit and trading activity to ensure proper commission attribution</li>
								<li>Provide you with relevant follow-up communications based on your trading progress</li>
								<li>Ensure transparency in our affiliate tracking system</li>
							</ul>
						</div>
					{/if}

					<!-- MT5 Login Section -->
					{#if activeSection === 'login'}
						<h2 class="text-2xl font-bold text-gray-900 mb-6">🔢 Finding Your MT5 Login Number</h2>

						<div class="prose max-w-none">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">Method 1: From MT5 Terminal</h3>
							<ol class="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
								<li>Open your MT5 trading terminal</li>
								<li>Look at the top of the terminal window</li>
								<li>Your login number appears next to your account balance</li>
								<li>It's typically a 6-12 digit number</li>
							</ol>

							<div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
								<p class="text-sm text-gray-700">
									<strong>Example:</strong> If you see "Account: 12345678 - Demo Account",
									your login number is <strong>12345678</strong>
								</p>
							</div>

							<h3 class="text-lg font-semibold text-gray-900 mb-4">Method 2: From Your Broker's Website</h3>
							<ol class="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
								<li>Log into your broker's client portal</li>
								<li>Navigate to "My Accounts" or "Trading Accounts"</li>
								<li>Look for your MT5 account details</li>
								<li>The login number will be listed there</li>
							</ol>

							<h3 class="text-lg font-semibold text-gray-900 mb-4">Method 3: From Registration Email</h3>
							<ol class="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
								<li>Check your email for account setup confirmation</li>
								<li>Look for emails from your broker with subject like "MT5 Account Created"</li>
								<li>Your login credentials will be in this email</li>
							</ol>

							<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
								<h4 class="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h4>
								<ul class="list-disc pl-4 space-y-1 text-yellow-800 text-sm">
									<li>Login numbers are usually 6-12 digits long</li>
									<li>Demo and live accounts have different login numbers</li>
									<li>Make sure you're using the correct account type</li>
								</ul>
							</div>
						</div>
					{/if}

					<!-- Server Name Section -->
					{#if activeSection === 'server'}
						<h2 class="text-2xl font-bold text-gray-900 mb-6">🌐 Finding Your Server Name</h2>

						<div class="prose max-w-none">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">Method 1: From MT5 Terminal</h3>
							<ol class="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
								<li>Open your MT5 terminal</li>
								<li>Go to <strong>File → Login to Trade Account</strong></li>
								<li>In the dialog box, you'll see the "Server" field</li>
								<li>This shows your current server name</li>
							</ol>

							<h3 class="text-lg font-semibold text-gray-900 mb-4">Method 2: From Account Information</h3>
							<ol class="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
								<li>In MT5, right-click in the "Terminal" window</li>
								<li>Select "Account Information"</li>
								<li>Look for the "Server" field</li>
								<li>Copy the exact server name shown</li>
							</ol>

							<h3 class="text-lg font-semibold text-gray-900 mb-4">Common Server Names by Broker</h3>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
								<div class="border border-gray-200 rounded-lg p-4">
									<h4 class="font-semibold text-gray-900 mb-2">Exness</h4>
									<ul class="text-sm text-gray-600 space-y-1">
										<li>• ExnessEU-Demo</li>
										<li>• ExnessEU-Real</li>
										<li>• ExnessEU-Real2</li>
									</ul>
								</div>
								<div class="border border-gray-200 rounded-lg p-4">
									<h4 class="font-semibold text-gray-900 mb-2">XM</h4>
									<ul class="text-sm text-gray-600 space-y-1">
										<li>• XM-Demo</li>
										<li>• XM-Real</li>
										<li>• XM-Real 2</li>
									</ul>
								</div>
								<div class="border border-gray-200 rounded-lg p-4">
									<h4 class="font-semibold text-gray-900 mb-2">FxPro</h4>
									<ul class="text-sm text-gray-600 space-y-1">
										<li>• FxPro-Demo</li>
										<li>• FxPro-Live</li>
										<li>• FxPro-Live02</li>
									</ul>
								</div>
								<div class="border border-gray-200 rounded-lg p-4">
									<h4 class="font-semibold text-gray-900 mb-2">IC Markets</h4>
									<ul class="text-sm text-gray-600 space-y-1">
										<li>• ICMarkets-Demo</li>
										<li>• ICMarkets-Live01</li>
										<li>• ICMarkets-Live02</li>
									</ul>
								</div>
							</div>

							<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<h4 class="font-semibold text-blue-900 mb-2">💡 Pro Tip</h4>
								<p class="text-blue-800 text-sm">
									Server names are case-sensitive and must be entered exactly as they appear.
									Copy and paste when possible to avoid typos.
								</p>
							</div>
						</div>
					{/if}

					<!-- Investor Password Section -->
					{#if activeSection === 'investor'}
						<h2 class="text-2xl font-bold text-gray-900 mb-6">🔐 Setting Up Investor Password</h2>

						<div class="prose max-w-none">
							<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
								<h4 class="font-semibold text-green-900 mb-2">✅ What is an Investor Password?</h4>
								<p class="text-green-800 text-sm">
									An investor password provides read-only access to your account. It allows us to verify
									your deposits and trades without any ability to modify your account or execute trades.
								</p>
							</div>

							<h3 class="text-lg font-semibold text-gray-900 mb-4">Creating an Investor Password</h3>
							<ol class="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
								<li>Open your MT5 terminal</li>
								<li>Go to <strong>Tools → Options</strong></li>
								<li>Click on the <strong>"Server"</strong> tab</li>
								<li>Click <strong>"Change"</strong> next to "Investor password"</li>
								<li>Enter a new password (6-20 characters)</li>
								<li>Confirm the password and click OK</li>
							</ol>

							<h3 class="text-lg font-semibold text-gray-900 mb-4">Alternative Method (Broker Website)</h3>
							<ol class="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
								<li>Log into your broker's client portal</li>
								<li>Navigate to "Account Settings" or "Security"</li>
								<li>Look for "Investor Password" or "Read-Only Password"</li>
								<li>Set a new investor password</li>
								<li>Save the changes</li>
							</ol>

							<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
								<h4 class="font-semibold text-yellow-900 mb-2">🔒 Password Requirements</h4>
								<ul class="list-disc pl-4 space-y-1 text-yellow-800 text-sm">
									<li>Usually 6-20 characters long</li>
									<li>Should be different from your main trading password</li>
									<li>Use a combination of letters and numbers</li>
									<li>Keep it secure but shareable for verification purposes</li>
								</ul>
							</div>

							<h3 class="text-lg font-semibold text-gray-900 mb-4">If You Can't Set an Investor Password</h3>
							<p class="text-gray-600 mb-4">
								Some brokers don't allow investor passwords or the feature might be disabled. In this case:
							</p>
							<ul class="list-disc pl-6 space-y-2 text-gray-600 mb-6">
								<li>Skip this field in our form - it's optional</li>
								<li>We can still verify your account using login and server information</li>
								<li>Contact your broker's support for assistance with investor passwords</li>
							</ul>

							<div class="bg-red-50 border border-red-200 rounded-lg p-4">
								<h4 class="font-semibold text-red-900 mb-2">🚨 Security Warning</h4>
								<p class="text-red-800 text-sm">
									<strong>NEVER</strong> share your main trading password with anyone. Only use investor
									passwords for account verification. We will never ask for your main trading password.
								</p>
							</div>
						</div>
					{/if}

					<!-- Troubleshooting Section -->
					{#if activeSection === 'troubleshooting'}
						<h2 class="text-2xl font-bold text-gray-900 mb-6">🔧 Troubleshooting Common Issues</h2>

						<div class="prose max-w-none">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">❌ "Invalid Login" Error</h3>
							<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
								<p class="text-red-800 text-sm mb-2"><strong>Possible Causes:</strong></p>
								<ul class="list-disc pl-4 space-y-1 text-red-700 text-sm">
									<li>Incorrect login number (check for typos)</li>
									<li>Using demo login for live account or vice versa</li>
									<li>Account may be disabled or suspended</li>
									<li>Wrong server selected</li>
								</ul>
							</div>

							<h3 class="text-lg font-semibold text-gray-900 mb-4">❌ "Server Not Found" Error</h3>
							<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
								<p class="text-red-800 text-sm mb-2"><strong>Solutions:</strong></p>
								<ul class="list-disc pl-4 space-y-1 text-red-700 text-sm">
									<li>Double-check server name spelling and capitalization</li>
									<li>Contact your broker for the correct server name</li>
									<li>Try connecting to the server in MT5 first</li>
									<li>Server names change occasionally - get the latest one</li>
								</ul>
							</div>

							<h3 class="text-lg font-semibold text-gray-900 mb-4">❌ "Investor Password Not Working"</h3>
							<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
								<p class="text-red-800 text-sm mb-2"><strong>Check These:</strong></p>
								<ul class="list-disc pl-4 space-y-1 text-red-700 text-sm">
									<li>Investor password feature may not be enabled</li>
									<li>You might need to contact broker support to enable it</li>
									<li>Password might have expired or been reset</li>
									<li>Some broker types don't support investor passwords</li>
								</ul>
							</div>

							<h3 class="text-lg font-semibold text-gray-900 mb-4">✅ Still Need Help?</h3>
							<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
								<h4 class="font-semibold text-blue-900 mb-2">Contact Options</h4>
								<div class="space-y-2 text-blue-800 text-sm">
									<p><strong>Email Support:</strong> support@example.com</p>
									<p><strong>Live Chat:</strong> Available 24/7 on our website</p>
									<p><strong>Broker Support:</strong> Contact your broker's customer service</p>
								</div>
							</div>

							<h3 class="text-lg font-semibold text-gray-900 mb-4">📋 Information to Have Ready</h3>
							<p class="text-gray-600 mb-4">When contacting support, please have this information ready:</p>
							<ul class="list-disc pl-6 space-y-2 text-gray-600">
								<li>Your email address used for registration</li>
								<li>Your broker name</li>
								<li>Account type (demo or live)</li>
								<li>Any error messages you're receiving</li>
								<li>Screenshot of your MT5 terminal (with sensitive info hidden)</li>
							</ul>
						</div>
					{/if}

					<!-- Back to Form Button -->
					<div class="mt-8 pt-6 border-t border-gray-200">
						<div class="flex justify-between items-center">
							<a
								href="/mt5"
								class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
							>
								← Back to MT5 Form
							</a>
							<p class="text-sm text-gray-500">
								Need more help? <a href="mailto:support@example.com" class="text-blue-600 hover:text-blue-800">Contact Support</a>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>