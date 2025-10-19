<script lang="ts">
	import { Calculator, TrendingUp, DollarSign, Users } from 'lucide-svelte';

	let monthlyLeads = 100;
	let conversionRate = 20;
	let avgDeposit = 500;
	let commissionType = 'cpa';
	let cpaAmount = 300;
	let revenueSharePercent = 30;
	let avgMonthlyVolume = 50000;

	$: convertedTraders = Math.round((monthlyLeads * conversionRate) / 100);
	$: totalDeposits = convertedTraders * avgDeposit;
	$: cpaCommission = convertedTraders * cpaAmount;
	$: monthlyRevShareCommission = Math.round((avgMonthlyVolume * revenueSharePercent) / 100);
	$: yearlyRevShareCommission = monthlyRevShareCommission * 12;

	$: totalMonthlyCommission = commissionType === 'cpa'
		? cpaCommission
		: monthlyRevShareCommission;

	$: totalYearlyCommission = commissionType === 'cpa'
		? cpaCommission * 12
		: yearlyRevShareCommission;
</script>

<svelte:head>
	<title>Commission Calculator - ClientFlow</title>
	<meta name="description" content="Calculate your potential earnings as a Forex IB with ClientFlow's commission calculator." />
</svelte:head>

<!-- Navigation -->
<nav class="fixed top-0 w-full z-50 bg-[#000000]/95 backdrop-blur-xl border-b border-gray-800">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-20">
			<a href="/" class="flex items-center space-x-3">
				<img src="/trendstec-logo.png" alt="ClientFlow" class="h-12 w-auto" />
				<span class="text-2xl font-bold text-white">ClientFlow</span>
			</a>
			<div class="hidden md:flex items-center space-x-8">
				<a href="/#how-it-works" class="text-gray-300 hover:text-white transition-colors font-medium">How It Works</a>
				<a href="/calculate" class="text-[#FF5722] font-bold">Calculator</a>
				<a href="/login" class="text-gray-300 hover:text-white transition-colors font-medium">Login</a>
				<a href="/#demo" class="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-orange-500/50">
					Get Started
				</a>
			</div>
		</div>
	</div>
</nav>

<!-- Main Content -->
<div class="min-h-screen bg-[#000000] pt-32 pb-20">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="text-center mb-16">
			<div class="inline-block mb-6">
				<div class="px-6 py-2 border-2 border-[#FF5722] bg-[#000000]">
					<span class="text-[#FF5722] font-bold tracking-wider text-sm">COMMISSION CALCULATOR</span>
				</div>
			</div>
			<h1 class="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
				CALCULATE YOUR EARNINGS
			</h1>
			<p class="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto">
				See your potential monthly and yearly commission based on your trading volumes
			</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
			<!-- Input Panel -->
			<div class="border-2 border-[#FF5722] bg-[#000000] p-8">
				<div class="border-b-2 border-[#FF5722] pb-4 mb-8">
					<h2 class="text-2xl font-bold text-white">INPUT YOUR DATA</h2>
				</div>

				<div class="space-y-8">
					<!-- Monthly Leads -->
					<div>
						<label class="block text-white font-bold mb-3 text-lg">
							Monthly Leads
						</label>
						<input
							type="range"
							bind:value={monthlyLeads}
							min="10"
							max="1000"
							step="10"
							class="w-full h-2 bg-gray-800 appearance-none cursor-pointer accent-[#FF5722]"
						/>
						<div class="mt-2 text-[#FF5722] font-bold text-3xl">{monthlyLeads}</div>
					</div>

					<!-- Conversion Rate -->
					<div>
						<label class="block text-white font-bold mb-3 text-lg">
							Conversion Rate (%)
						</label>
						<input
							type="range"
							bind:value={conversionRate}
							min="5"
							max="50"
							step="1"
							class="w-full h-2 bg-gray-800 appearance-none cursor-pointer accent-[#FF5722]"
						/>
						<div class="mt-2 text-[#FF5722] font-bold text-3xl">{conversionRate}%</div>
					</div>

					<!-- Average Deposit -->
					<div>
						<label class="block text-white font-bold mb-3 text-lg">
							Average First Deposit ($)
						</label>
						<input
							type="range"
							bind:value={avgDeposit}
							min="100"
							max="5000"
							step="50"
							class="w-full h-2 bg-gray-800 appearance-none cursor-pointer accent-[#FF5722]"
						/>
						<div class="mt-2 text-[#FF5722] font-bold text-3xl">${avgDeposit}</div>
					</div>

					<!-- Commission Type -->
					<div>
						<label class="block text-white font-bold mb-3 text-lg">
							Commission Model
						</label>
						<div class="grid grid-cols-2 gap-4">
							<button
								on:click={() => commissionType = 'cpa'}
								class="px-6 py-4 border-2 transition-all {commissionType === 'cpa' ? 'border-[#FF5722] bg-[#FF5722] text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'} font-bold"
							>
								CPA
							</button>
							<button
								on:click={() => commissionType = 'revshare'}
								class="px-6 py-4 border-2 transition-all {commissionType === 'revshare' ? 'border-[#FF5722] bg-[#FF5722] text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'} font-bold"
							>
								REV SHARE
							</button>
						</div>
					</div>

					{#if commissionType === 'cpa'}
						<!-- CPA Amount -->
						<div>
							<label class="block text-white font-bold mb-3 text-lg">
								CPA per Trader ($)
							</label>
							<input
								type="range"
								bind:value={cpaAmount}
								min="50"
								max="1000"
								step="50"
								class="w-full h-2 bg-gray-800 appearance-none cursor-pointer accent-[#FF5722]"
							/>
							<div class="mt-2 text-[#FF5722] font-bold text-3xl">${cpaAmount}</div>
						</div>
					{:else}
						<!-- Revenue Share -->
						<div>
							<label class="block text-white font-bold mb-3 text-lg">
								Revenue Share (%)
							</label>
							<input
								type="range"
								bind:value={revenueSharePercent}
								min="10"
								max="50"
								step="5"
								class="w-full h-2 bg-gray-800 appearance-none cursor-pointer accent-[#FF5722]"
							/>
							<div class="mt-2 text-[#FF5722] font-bold text-3xl">{revenueSharePercent}%</div>
						</div>

						<!-- Average Monthly Volume -->
						<div>
							<label class="block text-white font-bold mb-3 text-lg">
								Avg Monthly Volume per Trader ($)
							</label>
							<input
								type="range"
								bind:value={avgMonthlyVolume}
								min="10000"
								max="200000"
								step="5000"
								class="w-full h-2 bg-gray-800 appearance-none cursor-pointer accent-[#FF5722]"
							/>
							<div class="mt-2 text-[#FF5722] font-bold text-3xl">${avgMonthlyVolume.toLocaleString()}</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Results Panel -->
			<div class="space-y-6">
				<!-- Converted Traders -->
				<div class="border-2 border-[#FF5722] bg-[#000000] p-8">
					<div class="flex items-center mb-4">
						<Users class="w-8 h-8 text-[#FF5722] mr-3" />
						<h3 class="text-xl font-bold text-white">CONVERTED TRADERS</h3>
					</div>
					<div class="text-5xl font-bold text-[#FF5722] mb-2">{convertedTraders}</div>
					<div class="text-gray-400">traders per month</div>
				</div>

				<!-- Total Deposits -->
				<div class="border-2 border-gray-700 bg-[#000000] p-8">
					<div class="flex items-center mb-4">
						<DollarSign class="w-8 h-8 text-white mr-3" />
						<h3 class="text-xl font-bold text-white">TOTAL DEPOSITS</h3>
					</div>
					<div class="text-5xl font-bold text-white mb-2">${totalDeposits.toLocaleString()}</div>
					<div class="text-gray-400">per month</div>
				</div>

				<!-- Monthly Commission -->
				<div class="border-4 border-[#00FF00] bg-[#000000] p-8 relative">
					<div class="absolute top-0 left-0 w-full h-2 bg-[#00FF00]"></div>
					<div class="flex items-center mb-4 mt-2">
						<TrendingUp class="w-8 h-8 text-[#00FF00] mr-3" />
						<h3 class="text-xl font-bold text-white">MONTHLY COMMISSION</h3>
					</div>
					<div class="text-6xl font-bold text-[#00FF00] mb-2">${totalMonthlyCommission.toLocaleString()}</div>
					<div class="text-gray-400">{commissionType === 'cpa' ? 'CPA earnings' : 'Revenue share'}</div>
				</div>

				<!-- Yearly Projection -->
				<div class="border-4 border-[#FF5722] bg-[#000000] p-8 relative">
					<div class="absolute top-0 left-0 w-full h-2 bg-[#FF5722]"></div>
					<div class="flex items-center mb-4 mt-2">
						<Calculator class="w-8 h-8 text-[#FF5722] mr-3" />
						<h3 class="text-xl font-bold text-white">YEARLY PROJECTION</h3>
					</div>
					<div class="text-6xl font-bold text-[#FF5722] mb-2">${totalYearlyCommission.toLocaleString()}</div>
					<div class="text-gray-400">annual earnings</div>
				</div>

				<!-- CTA -->
				<div class="border-2 border-[#FF5722] bg-[#000000] p-8 text-center">
					<p class="text-white text-lg mb-6">Ready to automate your IB business?</p>
					<a href="/#demo" class="inline-block px-10 py-5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg font-bold rounded-xl transition-all shadow-lg shadow-orange-500/50 hover:scale-105">
						Get Started Now
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Footer -->
<footer class="bg-[#000000] border-t border-gray-800 py-12">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex flex-col md:flex-row justify-between items-center">
			<div class="flex items-center space-x-3 mb-6 md:mb-0">
				<img src="/trendstec-logo.png" alt="ClientFlow" class="h-10 w-auto" />
				<span class="text-xl font-bold text-white">ClientFlow</span>
			</div>
			<div class="flex flex-wrap justify-center space-x-6 text-sm text-gray-400">
				<a href="/" class="hover:text-white transition-colors">Home</a>
				<a href="/#how-it-works" class="hover:text-white transition-colors">How It Works</a>
				<a href="/calculate" class="hover:text-white transition-colors">Calculator</a>
				<a href="/login" class="hover:text-white transition-colors">Login</a>
			</div>
		</div>
		<div class="mt-8 text-center text-sm text-gray-500">
			<p>&copy; 2024 ClientFlow by TRENDSTEC. All rights reserved.</p>
		</div>
	</div>
</footer>
