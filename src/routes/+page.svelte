<svelte:head>
	<title>TRENDSTEC ClientFlow - Sales & Marketing CRM for Trading</title>
</svelte:head>

<div class="min-h-screen bg-black">
	<!-- Hero Section -->
	<div class="relative px-6 lg:px-8">
		<div class="mx-auto max-w-4xl pt-20 pb-32 sm:pt-32 sm:pb-40">
			<div class="text-center">
				<!-- Logo -->
				<div class="mb-12 flex justify-center">
					<img
						src="/trendstec-logo.png"
						alt="TRENDSTEC ClientFlow"
						class="h-32 w-auto drop-shadow-2xl"
						/>
				</div>
				<h1 class="text-5xl font-bold tracking-tight text-white sm:text-7xl bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
					TRENDSTEC ClientFlow
				</h1>
				<p class="mt-6 text-xl leading-8 text-gray-300 max-w-2xl mx-auto">
					Complete Sales & Marketing CRM to Capture, Nurture, Convert and Retain trading clients. Automated workflows, lead tracking, and commission management all in one platform.
				</p>
				<div class="mt-10 flex items-center justify-center gap-x-6">
					<a
						href="/dashboard"
						class="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70 hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105"
					>
						Open Dashboard →
					</a>
					<a href="#features" class="text-base font-semibold leading-6 text-orange-400 hover:text-orange-300 transition-colors">
						Learn more <span aria-hidden="true">↓</span>
					</a>
				</div>
			</div>
		</div>
	</div>

	<!-- Features Section -->
	<div id="features" class="bg-gradient-to-b from-black via-gray-900 to-black py-24 sm:py-32">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center">
				<h2 class="text-3xl font-bold tracking-tight text-white sm:text-5xl">
					Complete Client Lifecycle Management
				</h2>
				<p class="mt-6 text-lg leading-8 text-gray-400">
					From lead capture to conversion to retention. Automate your entire sales funnel with intelligent workflows and real-time tracking.
				</p>
			</div>
			<div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
				<dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-3">
					<!-- Feature 1 -->
					<div class="flex flex-col bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/50 transition-all hover:scale-105">
						<dt class="text-lg font-semibold leading-7 text-white">
							<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50">
								<span class="text-2xl">📥</span>
							</div>
							Automated Lead Capture
						</dt>
						<dd class="mt-2 flex flex-auto flex-col text-base leading-7 text-gray-400">
							<p class="flex-auto">
								Automatically capture leads from landing pages, forms, and marketing campaigns. Real-time webhook integration syncs contacts instantly.
							</p>
						</dd>
					</div>

					<!-- Feature 2 -->
					<div class="flex flex-col bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/50 transition-all hover:scale-105">
						<dt class="text-lg font-semibold leading-7 text-white">
							<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50">
								<span class="text-2xl">📊</span>
							</div>
							MT5 Trading Verification
						</dt>
						<dd class="mt-2 flex flex-auto flex-col text-base leading-7 text-gray-400">
							<p class="flex-auto">
								Scrape MT5 accounts with Playwright. Verify balances, equity, positions, and trading volume automatically.
							</p>
						</dd>
					</div>

					<!-- Feature 3 -->
					<div class="flex flex-col bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/50 transition-all hover:scale-105">
						<dt class="text-lg font-semibold leading-7 text-white">
							<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50">
								<span class="text-2xl">💰</span>
							</div>
							Commission Tracking
						</dt>
						<dd class="mt-2 flex flex-auto flex-col text-base leading-7 text-gray-400">
							<p class="flex-auto">
								Automatically calculate FTD and CPA commissions. Track affiliate earnings with configurable rates per broker.
							</p>
						</dd>
					</div>

					<!-- Feature 4 -->
					<div class="flex flex-col bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/50 transition-all hover:scale-105">
						<dt class="text-lg font-semibold leading-7 text-white">
							<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50">
								<span class="text-2xl">🔄</span>
							</div>
							Smart Automation Sync
						</dt>
						<dd class="mt-2 flex flex-auto flex-col text-base leading-7 text-gray-400">
							<p class="flex-auto">
								Push client data to your marketing automation backend. Update custom fields, add tags, and trigger personalized email/SMS sequences automatically.
							</p>
						</dd>
					</div>

					<!-- Feature 5 -->
					<div class="flex flex-col bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/50 transition-all hover:scale-105">
						<dt class="text-lg font-semibold leading-7 text-white">
							<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50">
								<span class="text-2xl">📈</span>
							</div>
							Real-Time Dashboard
						</dt>
						<dd class="mt-2 flex flex-auto flex-col text-base leading-7 text-gray-400">
							<p class="flex-auto">
								Monitor leads, MT5 accounts, and commissions in one place. Beautiful dark-themed UI with customizable color schemes.
							</p>
						</dd>
					</div>

					<!-- Feature 6 -->
					<div class="flex flex-col bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/50 transition-all hover:scale-105">
						<dt class="text-lg font-semibold leading-7 text-white">
							<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50">
								<span class="text-2xl">⚡</span>
							</div>
							Email & SMS Campaigns
						</dt>
						<dd class="mt-2 flex flex-auto flex-col text-base leading-7 text-gray-400">
							<p class="flex-auto">
								Create sophisticated nurture sequences with email and SMS. Trigger campaigns based on client behavior, engagement, and lifecycle stage.
							</p>
						</dd>
					</div>
				</dl>
			</div>
		</div>
	</div>

	<!-- CTA Section -->
	<div class="bg-black py-16">
		<div class="mx-auto max-w-7xl px-6 lg:px-8 text-center">
			<h2 class="text-3xl font-bold text-white mb-4">Ready to transform your sales & marketing?</h2>
			<p class="text-gray-400 mb-8 max-w-2xl mx-auto">
				Capture more leads, nurture effectively, convert faster, and retain longer with intelligent automation.
			</p>
			<a
				href="/dashboard"
				class="inline-flex items-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70 hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105"
			>
				Get Started Now →
			</a>
		</div>
	</div>
</div>
