<script lang="ts">
	import { Mail, User, Phone, CheckCircle, AlertTriangle } from 'lucide-svelte';

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
					tags: ['optin-lead', 'website-signup']
				})
			});

			if (response.ok) {
				submitted = true;
			} else {
				throw new Error('Failed to submit form');
			}
		} catch (err) {
			error = 'Failed to submit form. Please try again.';
			console.error('Optin form submission error:', err);
		} finally {
			submitting = false;
		}
	}

	function resetForm() {
		formData = {
			email: '',
			firstName: '',
			lastName: '',
			phone: ''
		};
		submitted = false;
		error = '';
	}
</script>

<svelte:head>
	<title>Sign Up - Get Started</title>
</svelte:head>

<div class="min-h-screen bg-black flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="bg-gradient-to-br from-gray-900 to-black border border-orange-500/20 rounded-2xl p-8 shadow-2xl">
			{#if !submitted}
				<form on:submit|preventDefault={submitForm} class="space-y-6">
					<div class="text-center mb-8">
						<h1 class="text-3xl font-bold text-white mb-2">Get Started</h1>
						<p class="text-gray-400">Join our community today</p>
					</div>

					{#if error}
						<div class="bg-black border border-red-600 rounded-lg p-4">
							<div class="flex items-center">
								<AlertTriangle class="w-5 h-5 text-red-400 mr-3" />
								<p class="text-red-300">{error}</p>
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
							class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
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
							class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
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
							class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
							placeholder="Doe"
						/>
					</div>

					<!-- Phone -->
					<div>
						<label for="phone" class="block text-sm font-medium text-gray-300 mb-2">
							<Phone class="w-4 h-4 inline mr-2" />
							Phone Number
						</label>
						<input
							type="tel"
							id="phone"
							bind:value={formData.phone}
							class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
							placeholder="+1 (555) 123-4567"
						/>
					</div>

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={submitting}
						class="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all shadow-lg shadow-orange-500/50"
					>
						{submitting ? 'Submitting...' : 'Get Started'}
					</button>
				</form>
			{:else}
				<!-- Success Message -->
				<div class="text-center py-12">
					<CheckCircle class="w-16 h-16 text-green-400 mx-auto mb-4" />
					<h3 class="text-2xl font-semibold text-white mb-2">Thank You!</h3>
					<p class="text-gray-400 mb-6">
						Your information has been submitted successfully. Check your email for next steps!
					</p>
					<button
						on:click={resetForm}
						class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
					>
						Submit Another
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
