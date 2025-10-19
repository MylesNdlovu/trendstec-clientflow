<script lang="ts">
	import { Mail, User, Phone, CheckCircle, AlertTriangle, TrendingUp, Zap, Clock, Shield } from 'lucide-svelte';

	let formData = {
		email: '',
		firstName: '',
		lastName: '',
		phone: ''
	};

	let submitting = false;
	let submitted = false;
	let error = '';

	async function submitForm() {
		submitting = true;
		error = '';

		try {
			const response = await fetch('/api/systeme/contacts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: formData.email,
					fields: [
						{ slug: 'first_name', value: formData.firstName },
						{ slug: 'last_name', value: formData.lastName },
						{ slug: 'phone', value: formData.phone }
					],
					tags: ['funding-offer', '1000-funding', 'lead-magnet']
				})
			});

			if (response.ok) {
				submitted = true;
			} else {
				throw new Error('Failed to submit form');
			}
		} catch (err) {
			error = 'Failed to submit form. Please try again.';
			console.error('Funding form submission error:', err);
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Get $1,000 Free Funding - Limited Offer</title>
	<meta name="description" content="Start trading with $1,000 in free funding. Limited spots available. Apply within 72 hours and get funded!" />
</svelte:head>

<div class="min-h-screen bg-black">
	<!-- Hero Section -->
	<div class="relative overflow-hidden">
		<!-- Background gradient -->
		<div class="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-black to-black"></div>

		<!-- Content -->
		<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
				<!-- Left Column - Copy -->
				<div class="text-center lg:text-left space-y-8">
					<!-- Limited Badge -->
					<div class="inline-flex items-center px-4 py-2 bg-red-600/20 border border-red-500/50 rounded-full">
						<Zap class="w-4 h-4 text-red-400 mr-2" />
						<span class="text-red-400 font-semibold text-sm uppercase tracking-wide">Limited: Only 47 Spots Left</span>
					</div>

					<!-- Headline -->
					<div>
						<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
							Get <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">$1,000 Free</span> Trading Funding
						</h1>
						<p class="text-xl sm:text-2xl text-gray-300 mb-6">
							Start your trading career with real capital. No catch, no tricks.
						</p>
					</div>

					<!-- Subheadline -->
					<p class="text-lg text-gray-400">
						Complete our simple 3-step process and you could be funded within <span class="text-orange-400 font-semibold">72 hours</span>. Join hundreds of traders already funded.
					</p>

					<!-- Trust Indicators -->
					<div class="grid grid-cols-3 gap-4 py-8">
						<div class="text-center">
							<div class="text-3xl font-bold text-orange-400">$1,000</div>
							<div class="text-sm text-gray-400 mt-1">Free Funding</div>
						</div>
						<div class="text-center">
							<div class="text-3xl font-bold text-orange-400">72hrs</div>
							<div class="text-sm text-gray-400 mt-1">Get Funded</div>
						</div>
						<div class="text-center">
							<div class="text-3xl font-bold text-orange-400">500+</div>
							<div class="text-sm text-gray-400 mt-1">Funded Traders</div>
						</div>
					</div>

					<!-- Image placeholder for desktop -->
					<div class="hidden lg:block">
						<div class="relative aspect-video rounded-2xl overflow-hidden border border-orange-500/20 shadow-2xl shadow-orange-500/20">
							<div class="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-black to-black flex items-center justify-center">
								<TrendingUp class="w-24 h-24 text-orange-500/30" />
							</div>
							<!-- Replace with actual image -->
							<img
								src="/images/trading-success.jpg"
								alt="Successful traders"
								class="w-full h-full object-cover mix-blend-overlay"
								on:error={(e) => e.target.style.display = 'none'}
							/>
						</div>
					</div>
				</div>

				<!-- Right Column - Form -->
				<div class="w-full">
					<div class="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-orange-500/20">
						{#if !submitted}
							<form on:submit|preventDefault={submitForm} class="space-y-6">
								<div class="text-center mb-8">
									<h2 class="text-2xl sm:text-3xl font-bold text-white mb-2">
										Claim Your $1,000 Now
									</h2>
									<p class="text-gray-400">Fill out the form below to get started</p>
								</div>

								{#if error}
									<div class="bg-black border border-red-600 rounded-lg p-4">
										<div class="flex items-center">
											<AlertTriangle class="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
											<p class="text-red-300 text-sm">{error}</p>
										</div>
									</div>
								{/if}

								<!-- Email -->
								<div>
									<label for="email" class="block text-sm font-medium text-gray-300 mb-2">
										<Mail class="w-4 h-4 inline mr-2" />
										Email Address *
									</label>
									<input
										type="email"
										id="email"
										bind:value={formData.email}
										required
										class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
										placeholder="your@email.com"
									/>
								</div>

								<!-- First Name -->
								<div>
									<label for="firstName" class="block text-sm font-medium text-gray-300 mb-2">
										<User class="w-4 h-4 inline mr-2" />
										First Name *
									</label>
									<input
										type="text"
										id="firstName"
										bind:value={formData.firstName}
										required
										class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
										placeholder="John"
									/>
								</div>

								<!-- Last Name -->
								<div>
									<label for="lastName" class="block text-sm font-medium text-gray-300 mb-2">
										<User class="w-4 h-4 inline mr-2" />
										Last Name *
									</label>
									<input
										type="text"
										id="lastName"
										bind:value={formData.lastName}
										required
										class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
										placeholder="Doe"
									/>
								</div>

								<!-- Phone -->
								<div>
									<label for="phone" class="block text-sm font-medium text-gray-300 mb-2">
										<Phone class="w-4 h-4 inline mr-2" />
										Phone Number *
									</label>
									<input
										type="tel"
										id="phone"
										bind:value={formData.phone}
										required
										class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
										placeholder="+1 (555) 123-4567"
									/>
								</div>

								<!-- Submit Button -->
								<button
									type="submit"
									disabled={submitting}
									class="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold rounded-lg transition-all shadow-lg shadow-orange-500/50 transform hover:scale-[1.02]"
								>
									{submitting ? 'Processing...' : '🚀 Get My $1,000 Funding Now'}
								</button>

								<p class="text-xs text-gray-500 text-center">
									By submitting, you agree to our terms and privacy policy. We'll contact you within 24 hours.
								</p>
							</form>
						{:else}
							<!-- Success Message -->
							<div class="text-center py-12">
								<CheckCircle class="w-20 h-20 text-green-400 mx-auto mb-6 animate-bounce" />
								<h3 class="text-3xl font-bold text-white mb-3">Welcome Aboard! 🎉</h3>
								<p class="text-lg text-gray-300 mb-4">
									Your application has been received!
								</p>
								<div class="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6 mb-6">
									<p class="text-gray-300 mb-2">
										<strong class="text-orange-400">What's Next?</strong>
									</p>
									<ul class="text-left text-gray-400 space-y-2 text-sm">
										<li class="flex items-start">
											<CheckCircle class="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
											Check your email for instructions (arrives in 5-10 minutes)
										</li>
										<li class="flex items-start">
											<CheckCircle class="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
											Complete your trader profile
										</li>
										<li class="flex items-start">
											<CheckCircle class="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
											Get funded within 72 hours!
										</li>
									</ul>
								</div>
								<p class="text-sm text-gray-500">
									Questions? Contact support@trendstec.com
								</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Mobile image -->
				<div class="lg:hidden">
					<div class="relative aspect-video rounded-2xl overflow-hidden border border-orange-500/20 shadow-2xl shadow-orange-500/20">
						<div class="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-black to-black flex items-center justify-center">
							<TrendingUp class="w-24 h-24 text-orange-500/30" />
						</div>
						<img
							src="/images/trading-success.jpg"
							alt="Successful traders"
							class="w-full h-full object-cover mix-blend-overlay"
							on:error={(e) => e.target.style.display = 'none'}
						/>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Benefits Section -->
	<div class="bg-gradient-to-b from-black to-gray-900 py-16 lg:py-24">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<h2 class="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
				Why Choose Our Funding Program?
			</h2>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<!-- Benefit 1 -->
				<div class="bg-black border border-orange-500/20 rounded-xl p-6 sm:p-8 text-center hover:border-orange-500/50 transition-all">
					<div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
						<Zap class="w-8 h-8 text-white" />
					</div>
					<h3 class="text-xl font-bold text-white mb-3">Fast Approval</h3>
					<p class="text-gray-400">
						Get approved in as little as 72 hours. No lengthy applications or waiting periods.
					</p>
				</div>

				<!-- Benefit 2 -->
				<div class="bg-black border border-orange-500/20 rounded-xl p-6 sm:p-8 text-center hover:border-orange-500/50 transition-all">
					<div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
						<Shield class="w-8 h-8 text-white" />
					</div>
					<h3 class="text-xl font-bold text-white mb-3">No Risk</h3>
					<p class="text-gray-400">
						Trade with our capital, not yours. Keep up to 80% of your profits with zero risk.
					</p>
				</div>

				<!-- Benefit 3 -->
				<div class="bg-black border border-orange-500/20 rounded-xl p-6 sm:p-8 text-center hover:border-orange-500/50 transition-all">
					<div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
						<TrendingUp class="w-8 h-8 text-white" />
					</div>
					<h3 class="text-xl font-bold text-white mb-3">Scale Up</h3>
					<p class="text-gray-400">
						Start with $1,000 and scale up to $100,000+ based on your performance.
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- How It Works Section -->
	<div class="bg-gray-900 py-16 lg:py-24">
		<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
			<h2 class="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
				3 Simple Steps to Get Funded
			</h2>

			<div class="space-y-8">
				<!-- Step 1 -->
				<div class="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
					<div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
						<span class="text-white font-bold text-xl">1</span>
					</div>
					<div class="flex-1">
						<h3 class="text-xl font-bold text-white mb-2">Submit Your Application</h3>
						<p class="text-gray-400">
							Fill out the simple form above with your basic information. Takes less than 2 minutes.
						</p>
					</div>
				</div>

				<!-- Step 2 -->
				<div class="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
					<div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
						<span class="text-white font-bold text-xl">2</span>
					</div>
					<div class="flex-1">
						<h3 class="text-xl font-bold text-white mb-2">Complete Your Profile</h3>
						<p class="text-gray-400">
							Check your email for a link to complete your trader profile. We'll verify your identity and trading experience.
						</p>
					</div>
				</div>

				<!-- Step 3 -->
				<div class="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
					<div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
						<span class="text-white font-bold text-xl">3</span>
					</div>
					<div class="flex-1">
						<h3 class="text-xl font-bold text-white mb-2">Start Trading</h3>
						<p class="text-gray-400">
							Once approved, you'll receive your funded account credentials. Start trading immediately with $1,000 in capital!
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Final CTA -->
	<div class="bg-gradient-to-r from-orange-600 to-red-600 py-12 lg:py-16">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
			<h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
				Don't Miss This Opportunity
			</h2>
			<p class="text-xl text-white/90 mb-8">
				Only <span class="font-bold">47 spots remaining</span> for this funding round. Apply now before it's too late!
			</p>
			<a
				href="#top"
				class="inline-block px-8 py-4 bg-white text-orange-600 font-bold text-lg rounded-lg hover:bg-gray-100 transition-all shadow-xl transform hover:scale-105"
			>
				Claim My $1,000 Funding
			</a>
		</div>
	</div>

	<!-- Footer -->
	<div class="bg-black py-8 border-t border-gray-800">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
			<p>© 2024 TRENDSTEC. All rights reserved.</p>
		</div>
	</div>
</div>
