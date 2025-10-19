<script lang="ts">
	import { CheckCircle, ArrowRight } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Thank You - Demo Request Received | ClientFlow</title>
</svelte:head>

<div class="min-h-screen bg-black flex items-center justify-center px-4">
	<div class="max-w-2xl mx-auto text-center">
		<!-- Success Icon -->
		<div class="mb-8 flex justify-center">
			<div class="w-24 h-24 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/50 animate-bounce">
				<CheckCircle class="w-16 h-16 text-white" />
			</div>
		</div>

		<!-- Thank You Message -->
		<h1 class="text-5xl md:text-6xl font-bold text-white mb-6">
			You're <span class="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">All Set!</span>
		</h1>

		<p class="text-xl text-gray-400 mb-12 leading-relaxed">
			Thank you for requesting a demo! Our team will review your information and get back to you within 24 hours with your personalized demo access.
		</p>

		<!-- What's Next Section -->
		<div class="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8 mb-12 text-left">
			<h2 class="text-2xl font-bold text-white mb-6">What Happens Next?</h2>
			<div class="space-y-4">
				<div class="flex items-start">
					<div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mr-4">
						<span class="text-white font-bold text-sm">1</span>
					</div>
					<div>
						<h3 class="text-white font-semibold mb-1">Instant Confirmation</h3>
						<p class="text-gray-400 text-sm">Check your email for a confirmation message with next steps.</p>
					</div>
				</div>

				<div class="flex items-start">
					<div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mr-4">
						<span class="text-white font-bold text-sm">2</span>
					</div>
					<div>
						<h3 class="text-white font-semibold mb-1">Demo Account Setup</h3>
						<p class="text-gray-400 text-sm">We'll create your personalized demo account with sample data within 24 hours.</p>
					</div>
				</div>

				<div class="flex items-start">
					<div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mr-4">
						<span class="text-white font-bold text-sm">3</span>
					</div>
					<div>
						<h3 class="text-white font-semibold mb-1">Personalized Walkthrough</h3>
						<p class="text-gray-400 text-sm">Get a guided tour and see how ClientFlow can 3x your IB commissions.</p>
					</div>
				</div>
			</div>
		</div>

		<!-- CTA Buttons -->
		<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
			<a href="/" class="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-105 flex items-center space-x-2">
				<span>Back to Home</span>
				<ArrowRight class="w-5 h-5" />
			</a>
			<a href="/login" class="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all backdrop-blur-sm">
				Already Have an Account?
			</a>
		</div>

		<!-- Footer Note -->
		<div class="mt-12 p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl">
			<p class="text-orange-400 text-sm">
				<strong>Pro Tip:</strong> While you wait, check out our blog for strategies on how top IBs are generating $50,000+ monthly with automated lead funnels.
			</p>
		</div>
	</div>
</div>
