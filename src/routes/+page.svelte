<script lang="ts">
	import { ArrowRight, TrendingUp, Users, Target, Shield, Zap, BarChart3, DollarSign, CheckCircle, ArrowDownRight, Clock, ChevronRight } from 'lucide-svelte';

	// Multi-step form state
	let currentStep = 1;
	let formData = {
		email: '',
		name: '',
		phone: '',
		ib_type: '',
		monthly_leads: '',
		broker_network: '',
		message: ''
	};

	let isSubmitting = false;

	function nextStep() {
		if (currentStep < 6) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	async function handleSubmit() {
		isSubmitting = true;
		try {
			const response = await fetch('/api/demo-request', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				window.location.href = '/demo-thank-you';
			} else {
				alert('Something went wrong. Please try again.');
				isSubmitting = false;
			}
		} catch (error) {
			alert('Something went wrong. Please try again.');
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>ClientFlow - Generate $5K-$50K+ Monthly | Forex IB Lead Automation</title>
	<meta name="description" content="Turn your ad spend into 5X-15X ROI with our proven lead automation system. Limited to 50 Forex IBs per month." />
</svelte:head>

<!-- Navigation -->
<nav class="fixed top-0 w-full z-50 bg-[#000000]/95 backdrop-blur-xl border-b border-gray-800">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-20">
			<div class="flex items-center space-x-3">
				<img src="/trendstec-logo.png" alt="ClientFlow" class="h-12 w-auto" />
				<span class="text-2xl font-bold text-white">ClientFlow</span>
			</div>
			<div class="hidden md:flex items-center space-x-8">
				<a href="#how-it-works" class="text-gray-300 hover:text-white transition-colors font-medium">How It Works</a>
				<a href="/calculate" class="text-gray-300 hover:text-white transition-colors font-medium">Calculator</a>
				<a href="/login" class="text-gray-300 hover:text-white transition-colors font-medium">Login</a>
				<a href="#demo" class="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-orange-500/50">
					Get Started
				</a>
			</div>
		</div>
	</div>
</nav>

<!-- Hero Section -->
<section class="relative min-h-screen flex items-center justify-center bg-[#000000] overflow-hidden pt-20">
	<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 sm:py-20">
		<!-- Scarcity Badge -->
		<div class="inline-flex items-center px-6 py-3 bg-red-600 rounded-full mb-8 shadow-xl shadow-red-600/50">
			<Clock class="w-5 h-5 text-white mr-2 flex-shrink-0" />
			<span class="text-sm sm:text-base text-white font-bold">LIMITED: 47 Spots Left This Month</span>
		</div>

		<!-- Headline -->
		<h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
			Turn Your Ad Spend Into<br class="hidden sm:block"/>
			<span class="text-[#FF5722]">5X to 15X ROI</span>
		</h1>

		<!-- Subheadline -->
		<p class="text-lg sm:text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
			Done-for-you lead automation that captures, nurtures, converts, and retains traders on autopilot.
		</p>

		<!-- Income Statement Card -->
		<div class="bg-[#FF5722] rounded-2xl p-8 sm:p-10 max-w-2xl mx-auto mb-12 shadow-2xl shadow-[#FF5722]/50">
			<p class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">$5,000 to $50,000+</p>
			<p class="text-lg sm:text-xl text-orange-100">Monthly commission potential</p>
		</div>

		<!-- CTA Buttons -->
		<div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
			<a href="#demo" class="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-105 flex items-center justify-center space-x-2">
				<span>Get Your System Now</span>
				<ArrowRight class="w-5 h-5" />
			</a>
			<a href="#how-it-works" class="w-full sm:w-auto px-10 py-5 bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 text-white text-lg font-bold rounded-xl transition-all shadow-lg">
				See How It Works
			</a>
		</div>

		<!-- Trust Bar -->
		<div class="inline-flex items-center px-6 py-3 bg-gray-900 border border-gray-800 rounded-full">
			<span class="text-sm text-gray-400">Trusted by 500+ Forex IBs & Affiliates</span>
		</div>
	</div>
</section>

<!-- Stats Bar -->
<section class="bg-gray-900 py-12 border-y border-gray-800">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-2 md:grid-cols-4 gap-8">
			<div class="text-center">
				<div class="text-4xl md:text-5xl font-bold text-[#FF5722] mb-2">5-15X</div>
				<div class="text-sm text-gray-400">Average ROI</div>
			</div>
			<div class="text-center">
				<div class="text-4xl md:text-5xl font-bold text-white mb-2">$2M+</div>
				<div class="text-sm text-gray-400">Commissions Generated</div>
			</div>
			<div class="text-center">
				<div class="text-4xl md:text-5xl font-bold text-white mb-2">50K+</div>
				<div class="text-sm text-gray-400">Leads Converted</div>
			</div>
			<div class="text-center">
				<div class="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
				<div class="text-sm text-gray-400">Automated</div>
			</div>
		</div>
	</div>
</section>

<!-- How It Works - 4-Step Flow -->
<section id="how-it-works" class="py-20 sm:py-32 bg-[#000000] relative overflow-hidden">
	<!-- Futuristic Grid Background -->
	<div class="absolute inset-0 opacity-20">
		<div class="absolute inset-0" style="background-image: linear-gradient(#FF5722 1px, transparent 1px), linear-gradient(90deg, #FF5722 1px, transparent 1px); background-size: 50px 50px;"></div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
		<!-- Section Header -->
		<div class="text-center mb-20">
			<div class="inline-block mb-6">
				<div class="px-6 py-2 border-2 border-[#FF5722] bg-[#000000]">
					<span class="text-[#FF5722] font-bold tracking-wider text-sm">AUTOMATION SYSTEM</span>
				</div>
			</div>
			<h2 class="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
				THE 4-STEP SYSTEM
			</h2>
			<p class="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto">
				Military-grade automation that generates commissions 24/7
			</p>
		</div>

		<!-- Flow Steps - Vertical Timeline -->
		<div class="max-w-5xl mx-auto">
			<!-- Step 1: CAPTURE -->
			<div class="relative mb-12">
				<div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
					<!-- Step Number -->
					<div class="md:col-span-2 flex justify-center md:justify-end">
						<div class="relative">
							<div class="w-24 h-24 border-4 border-[#FF5722] bg-[#000000] flex items-center justify-center">
								<span class="text-4xl font-bold text-[#FF5722]">01</span>
							</div>
							<div class="absolute -bottom-2 -right-2 w-24 h-24 border-2 border-[#FF5722] opacity-30"></div>
						</div>
					</div>

					<!-- Content -->
					<div class="md:col-span-10">
						<div class="border-2 border-[#FF5722] bg-[#000000] p-8 relative">
							<div class="absolute top-0 left-0 w-2 h-full bg-[#FF5722]"></div>
							<div class="pl-6">
								<h3 class="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">CAPTURE</h3>
								<p class="text-lg text-gray-300 mb-6 leading-relaxed">
									Smart lead capture forms automatically collect trader information from your ads, landing pages, and social media.
								</p>
								<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div class="border border-[#FF5722] bg-[#000000] p-3">
										<div class="text-[#FF5722] font-bold text-sm">→ Real-time validation</div>
									</div>
									<div class="border border-[#FF5722] bg-[#000000] p-3">
										<div class="text-[#FF5722] font-bold text-sm">→ Instant CRM sync</div>
									</div>
									<div class="border border-[#FF5722] bg-[#000000] p-3">
										<div class="text-[#FF5722] font-bold text-sm">→ Duplicate detection</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Connector Line -->
				<div class="flex justify-center my-6">
					<div class="w-1 h-12 bg-[#FF5722]"></div>
				</div>
			</div>

			<!-- Step 2: NURTURE -->
			<div class="relative mb-12">
				<div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
					<div class="md:col-span-2 flex justify-center md:justify-end">
						<div class="relative">
							<div class="w-24 h-24 border-4 border-[#FF5722] bg-[#000000] flex items-center justify-center">
								<span class="text-4xl font-bold text-[#FF5722]">02</span>
							</div>
							<div class="absolute -bottom-2 -right-2 w-24 h-24 border-2 border-[#FF5722] opacity-30"></div>
						</div>
					</div>

					<div class="md:col-span-10">
						<div class="border-2 border-[#FF5722] bg-[#000000] p-8 relative">
							<div class="absolute top-0 left-0 w-2 h-full bg-[#FF5722]"></div>
							<div class="pl-6">
								<h3 class="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">NURTURE</h3>
								<p class="text-lg text-gray-300 mb-6 leading-relaxed">
									Automated email and SMS sequences educate leads about trading, build trust, and warm them up for conversion.
								</p>
								<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div class="border border-[#FF5722] bg-[#000000] p-3">
										<div class="text-[#FF5722] font-bold text-sm">→ Personalized messaging</div>
									</div>
									<div class="border border-[#FF5722] bg-[#000000] p-3">
										<div class="text-[#FF5722] font-bold text-sm">→ Behavioral triggers</div>
									</div>
									<div class="border border-[#FF5722] bg-[#000000] p-3">
										<div class="text-[#FF5722] font-bold text-sm">→ Educational content</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="flex justify-center my-6">
					<div class="w-1 h-12 bg-[#FF5722]"></div>
				</div>
			</div>

			<!-- Step 3: CONVERT -->
			<div class="relative mb-12">
				<div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
					<div class="md:col-span-2 flex justify-center md:justify-end">
						<div class="relative">
							<div class="w-24 h-24 border-4 border-[#FF5722] bg-[#000000] flex items-center justify-center">
								<span class="text-4xl font-bold text-[#FF5722]">03</span>
							</div>
							<div class="absolute -bottom-2 -right-2 w-24 h-24 border-2 border-[#FF5722] opacity-30"></div>
						</div>
					</div>

					<div class="md:col-span-10">
						<div class="border-2 border-[#FF5722] bg-[#000000] p-8 relative">
							<div class="absolute top-0 left-0 w-2 h-full bg-[#FF5722]"></div>
							<div class="pl-6">
								<h3 class="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">CONVERT</h3>
								<p class="text-lg text-gray-300 mb-6 leading-relaxed">
									Advanced tracking monitors account openings, first deposits, and trading activity - triggering your commissions.
								</p>
								<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div class="border border-[#FF5722] bg-[#000000] p-3">
										<div class="text-[#FF5722] font-bold text-sm">→ Account monitoring</div>
									</div>
									<div class="border border-[#FF5722] bg-[#000000] p-3">
										<div class="text-[#FF5722] font-bold text-sm">→ Deposit tracking</div>
									</div>
									<div class="border border-[#FF5722] bg-[#000000] p-3">
										<div class="text-[#FF5722] font-bold text-sm">→ Commission calc</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="flex justify-center my-6">
					<div class="w-1 h-12 bg-[#FF5722]"></div>
				</div>
			</div>

			<!-- Step 4: RETAIN -->
			<div class="relative">
				<div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
					<div class="md:col-span-2 flex justify-center md:justify-end">
						<div class="relative">
							<div class="w-24 h-24 border-4 border-[#00FF00] bg-[#000000] flex items-center justify-center">
								<span class="text-4xl font-bold text-[#00FF00]">04</span>
							</div>
							<div class="absolute -bottom-2 -right-2 w-24 h-24 border-2 border-[#00FF00] opacity-30"></div>
						</div>
					</div>

					<div class="md:col-span-10">
						<div class="border-2 border-[#00FF00] bg-[#000000] p-8 relative">
							<div class="absolute top-0 left-0 w-2 h-full bg-[#00FF00]"></div>
							<div class="pl-6">
								<h3 class="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">RETAIN</h3>
								<p class="text-lg text-gray-300 mb-6 leading-relaxed">
									Keep traders active with engagement campaigns, trading tips, and performance updates for recurring commissions.
								</p>
								<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div class="border border-[#00FF00] bg-[#000000] p-3">
										<div class="text-[#00FF00] font-bold text-sm">→ Re-engagement</div>
									</div>
									<div class="border border-[#00FF00] bg-[#000000] p-3">
										<div class="text-[#00FF00] font-bold text-sm">→ Performance insights</div>
									</div>
									<div class="border border-[#00FF00] bg-[#000000] p-3">
										<div class="text-[#00FF00] font-bold text-sm">→ Lifetime value</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- ROI Visualization -->
		<div class="mt-32 max-w-5xl mx-auto">
			<div class="border-4 border-[#FF5722] bg-[#000000] p-12 relative">
				<div class="absolute top-0 left-0 w-full h-2 bg-[#FF5722]"></div>
				<div class="text-center mb-12">
					<h3 class="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">5X TO 15X RETURN</h3>
					<p class="text-xl text-gray-300">
						Stop wasting money. Our automation ensures every dollar generates maximum commissions.
					</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
					<div class="border-2 border-gray-700 bg-[#000000] p-8 text-center">
						<div class="text-5xl font-bold text-white mb-2">$1,000</div>
						<div class="text-sm text-gray-400 uppercase tracking-wider">Ad Spend Input</div>
					</div>

					<div class="flex justify-center">
						<ArrowRight class="w-16 h-16 text-[#FF5722]" />
					</div>

					<div class="border-2 border-[#FF5722] bg-[#000000] p-8 text-center relative">
						<div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FF5722] border-2 border-[#FF5722]">
							<span class="text-white font-bold text-sm">RESULT</span>
						</div>
						<div class="text-5xl font-bold text-[#FF5722] mb-2">$5K-$15K</div>
						<div class="text-sm text-[#FF5722] uppercase tracking-wider font-bold">Commission Revenue</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>


<!-- Demo Request Form -->
<section id="demo" class="py-20 sm:py-32 bg-[#000000]">
	<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="text-center mb-12">
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
				Get Instant Access
			</h2>
			<p class="text-xl sm:text-2xl text-gray-300 mb-6">
				See how our automation can 5X-15X your ad spend
			</p>
			<div class="inline-flex items-center px-6 py-3 bg-red-600 rounded-full shadow-xl shadow-red-600/50">
				<Clock class="w-5 h-5 text-white mr-2" />
				<span class="text-white font-bold text-sm sm:text-base">47 demo spots left this month</span>
			</div>
		</div>

		<!-- Multi-Step Form -->
		<div class="bg-[#000000] border-2 border-[#FF5722] p-8 sm:p-12 min-h-[500px] relative">
			<!-- Progress Bar -->
			<div class="mb-12">
				<div class="flex justify-between items-center mb-2">
					<span class="text-gray-400 text-sm">Step {currentStep} of 6</span>
					<span class="text-gray-400 text-sm">{Math.round((currentStep / 6) * 100)}%</span>
				</div>
				<div class="w-full h-1 bg-gray-800">
					<div class="h-full bg-[#FF5722] transition-all duration-300" style="width: {(currentStep / 6) * 100}%"></div>
				</div>
			</div>

			<!-- Step 1: Email -->
			{#if currentStep === 1}
				<div class="space-y-6 animate-fade-in">
					<h3 class="text-3xl sm:text-4xl font-bold text-white mb-4">What's your email?</h3>
					<p class="text-gray-400 mb-6">We'll send your demo access link here</p>
					<input
						type="email"
						bind:value={formData.email}
						on:keydown={(e) => e.key === 'Enter' && formData.email && nextStep()}
						required
						autofocus
						class="w-full px-6 py-6 bg-[#000000] border-2 border-[#FF5722] text-white text-2xl placeholder-gray-600 focus:outline-none transition-colors"
						placeholder="your@email.com"
					/>
					<button
						on:click={nextStep}
						disabled={!formData.email}
						class="mt-8 px-10 py-5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white text-lg font-bold transition-all shadow-lg shadow-orange-500/50 hover:scale-105 inline-flex items-center space-x-2"
					>
						<span>Continue</span>
						<ArrowRight class="w-5 h-5" />
					</button>
					<p class="text-xs text-gray-500 mt-4">Press Enter ↵</p>
				</div>
			{/if}

			<!-- Step 2: Name -->
			{#if currentStep === 2}
				<div class="space-y-6 animate-fade-in">
					<h3 class="text-3xl sm:text-4xl font-bold text-white mb-4">What's your name?</h3>
					<p class="text-gray-400 mb-6">So we can personalize your demo</p>
					<input
						type="text"
						bind:value={formData.name}
						on:keydown={(e) => e.key === 'Enter' && formData.name && nextStep()}
						required
						autofocus
						class="w-full px-6 py-6 bg-[#000000] border-2 border-[#FF5722] text-white text-2xl placeholder-gray-600 focus:outline-none transition-colors"
						placeholder="John Doe"
					/>
					<div class="flex space-x-4 mt-8">
						<button
							on:click={prevStep}
							class="px-8 py-4 border-2 border-gray-700 text-gray-400 hover:border-gray-600 font-bold transition-all"
						>
							Back
						</button>
						<button
							on:click={nextStep}
							disabled={!formData.name}
							class="px-10 py-5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white text-lg font-bold transition-all shadow-lg shadow-orange-500/50 hover:scale-105 inline-flex items-center space-x-2"
						>
							<span>Continue</span>
							<ArrowRight class="w-5 h-5" />
						</button>
					</div>
					<p class="text-xs text-gray-500 mt-4">Press Enter ↵</p>
				</div>
			{/if}

			<!-- Step 3: Phone -->
			{#if currentStep === 3}
				<div class="space-y-6 animate-fade-in">
					<h3 class="text-3xl sm:text-4xl font-bold text-white mb-4">Phone number?</h3>
					<p class="text-gray-400 mb-6">Optional - for faster support</p>
					<input
						type="tel"
						bind:value={formData.phone}
						on:keydown={(e) => e.key === 'Enter' && nextStep()}
						autofocus
						class="w-full px-6 py-6 bg-[#000000] border-2 border-[#FF5722] text-white text-2xl placeholder-gray-600 focus:outline-none transition-colors"
						placeholder="+1 (555) 000-0000"
					/>
					<div class="flex space-x-4 mt-8">
						<button
							on:click={prevStep}
							class="px-8 py-4 border-2 border-gray-700 text-gray-400 hover:border-gray-600 font-bold transition-all"
						>
							Back
						</button>
						<button
							on:click={nextStep}
							class="px-10 py-5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg font-bold transition-all shadow-lg shadow-orange-500/50 hover:scale-105 inline-flex items-center space-x-2"
						>
							<span>Continue</span>
							<ArrowRight class="w-5 h-5" />
						</button>
					</div>
					<p class="text-xs text-gray-500 mt-4">Press Enter ↵</p>
				</div>
			{/if}

			<!-- Step 4: IB Type -->
			{#if currentStep === 4}
				<div class="space-y-6 animate-fade-in">
					<h3 class="text-3xl sm:text-4xl font-bold text-white mb-4">What type of IB are you?</h3>
					<p class="text-gray-400 mb-6">Select your business model</p>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<button
							on:click={() => { formData.ib_type = 'forex_ib'; nextStep(); }}
							class="p-6 border-2 border-gray-700 hover:border-[#FF5722] text-white text-left transition-all group"
						>
							<div class="text-xl font-bold mb-2 group-hover:text-[#FF5722]">Forex IB</div>
							<div class="text-sm text-gray-400">Traditional forex broker affiliate</div>
						</button>
						<button
							on:click={() => { formData.ib_type = 'crypto_affiliate'; nextStep(); }}
							class="p-6 border-2 border-gray-700 hover:border-[#FF5722] text-white text-left transition-all group"
						>
							<div class="text-xl font-bold mb-2 group-hover:text-[#FF5722]">Crypto Affiliate</div>
							<div class="text-sm text-gray-400">Cryptocurrency trading partner</div>
						</button>
						<button
							on:click={() => { formData.ib_type = 'cfd_partner'; nextStep(); }}
							class="p-6 border-2 border-gray-700 hover:border-[#FF5722] text-white text-left transition-all group"
						>
							<div class="text-xl font-bold mb-2 group-hover:text-[#FF5722]">CFD Partner</div>
							<div class="text-sm text-gray-400">CFDs and derivatives</div>
						</button>
						<button
							on:click={() => { formData.ib_type = 'multi_asset'; nextStep(); }}
							class="p-6 border-2 border-gray-700 hover:border-[#FF5722] text-white text-left transition-all group"
						>
							<div class="text-xl font-bold mb-2 group-hover:text-[#FF5722]">Multi-Asset IB</div>
							<div class="text-sm text-gray-400">Multiple product types</div>
						</button>
					</div>
					<button
						on:click={prevStep}
						class="mt-8 px-8 py-4 border-2 border-gray-700 text-gray-400 hover:border-gray-600 font-bold transition-all"
					>
						Back
					</button>
				</div>
			{/if}

			<!-- Step 5: Monthly Leads -->
			{#if currentStep === 5}
				<div class="space-y-6 animate-fade-in">
					<h3 class="text-3xl sm:text-4xl font-bold text-white mb-4">Current monthly lead volume?</h3>
					<p class="text-gray-400 mb-6">Help us customize your demo</p>
					<div class="grid grid-cols-1 gap-4">
						<button
							on:click={() => { formData.monthly_leads = '0-50'; nextStep(); }}
							class="p-6 border-2 border-gray-700 hover:border-[#FF5722] text-white text-left transition-all group"
						>
							<div class="text-xl font-bold group-hover:text-[#FF5722]">0-50 leads/month</div>
						</button>
						<button
							on:click={() => { formData.monthly_leads = '51-200'; nextStep(); }}
							class="p-6 border-2 border-gray-700 hover:border-[#FF5722] text-white text-left transition-all group"
						>
							<div class="text-xl font-bold group-hover:text-[#FF5722]">51-200 leads/month</div>
						</button>
						<button
							on:click={() => { formData.monthly_leads = '201-500'; nextStep(); }}
							class="p-6 border-2 border-gray-700 hover:border-[#FF5722] text-white text-left transition-all group"
						>
							<div class="text-xl font-bold group-hover:text-[#FF5722]">201-500 leads/month</div>
						</button>
						<button
							on:click={() => { formData.monthly_leads = '500+'; nextStep(); }}
							class="p-6 border-2 border-gray-700 hover:border-[#FF5722] text-white text-left transition-all group"
						>
							<div class="text-xl font-bold group-hover:text-[#FF5722]">500+ leads/month</div>
						</button>
					</div>
					<button
						on:click={prevStep}
						class="mt-8 px-8 py-4 border-2 border-gray-700 text-gray-400 hover:border-gray-600 font-bold transition-all"
					>
						Back
					</button>
				</div>
			{/if}

			<!-- Step 6: Broker Network -->
			{#if currentStep === 6}
				<div class="space-y-6 animate-fade-in">
					<h3 class="text-3xl sm:text-4xl font-bold text-white mb-4">Which broker networks?</h3>
					<p class="text-gray-400 mb-6">Tell us who you work with</p>
					<input
						type="text"
						bind:value={formData.broker_network}
						autofocus
						required
						class="w-full px-6 py-6 bg-[#000000] border-2 border-[#FF5722] text-white text-2xl placeholder-gray-600 focus:outline-none transition-colors"
						placeholder="e.g., XM, Exness, IC Markets"
					/>
					<div class="flex space-x-4 mt-8">
						<button
							on:click={prevStep}
							class="px-8 py-4 border-2 border-gray-700 text-gray-400 hover:border-gray-600 font-bold transition-all"
						>
							Back
						</button>
						<button
							on:click={handleSubmit}
							disabled={!formData.broker_network || isSubmitting}
							class="px-10 py-5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white text-lg font-bold transition-all shadow-lg shadow-orange-500/50 hover:scale-105 inline-flex items-center space-x-2"
						>
							<span>{isSubmitting ? 'Submitting...' : 'Get Demo Access'}</span>
							<ArrowRight class="w-5 h-5" />
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="bg-[#000000] border-t border-gray-800 py-12">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex flex-col md:flex-row justify-between items-center">
			<div class="flex items-center space-x-3 mb-6 md:mb-0">
				<img src="/trendstec-logo.png" alt="ClientFlow" class="h-10 w-auto" />
				<span class="text-xl font-bold text-white">ClientFlow</span>
			</div>
			<div class="flex flex-wrap justify-center space-x-6 text-sm text-gray-400">
				<a href="/login" class="hover:text-white transition-colors">Login</a>
				<a href="#how-it-works" class="hover:text-white transition-colors">How It Works</a>
				<a href="/calculate" class="hover:text-white transition-colors">Calculator</a>
				<a href="#demo" class="hover:text-white transition-colors">Demo</a>
			</div>
		</div>
		<div class="mt-8 text-center text-sm text-gray-500">
			<p>&copy; 2024 ClientFlow by TRENDSTEC. All rights reserved.</p>
		</div>
	</div>
</footer>
