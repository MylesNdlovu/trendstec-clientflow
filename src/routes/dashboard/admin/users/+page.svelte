<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;

	let loading = false;
	let editingUser: any = null;
	let showDeleteConfirm: string | null = null;
</script>

<svelte:head>
	<title>User Management - TRENDSTEC ClientFlow</title>
</svelte:head>

<div class="p-6 space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold text-white">User Management</h1>
			<p class="text-gray-400 mt-1">Manage user accounts and roles</p>
		</div>
		<button
			on:click={() => (editingUser = { name: '', email: '', role: 'USER' })}
			class="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg transition-all shadow-lg shadow-orange-500/50"
		>
			+ Add User
		</button>
	</div>

	<!-- Users Table -->
	<div class="bg-black rounded-lg border border-orange-500/20 overflow-hidden">
		<table class="w-full">
			<thead class="bg-black border-b border-orange-500/20">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
						Name
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
						Email
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
						Role
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
						Status
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
						Last Login
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
						Actions
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-orange-500/20">
				{#each data.users as user}
					<tr class="hover:bg-orange-500/10 transition-colors">
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm font-medium text-white">{user.name || 'N/A'}</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm text-gray-300">{user.email}</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span
								class="px-2 py-1 text-xs rounded-full {user.role === 'ADMIN'
									? 'bg-orange-900/30 text-orange-400 border border-orange-700'
									: 'bg-black text-gray-400 border border-gray-700'}"
							>
								{user.role}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span
								class="px-2 py-1 text-xs rounded-full {user.isActive
									? 'bg-green-900/30 text-green-400 border border-green-700'
									: 'bg-red-900/30 text-red-400 border border-red-700'}"
							>
								{user.isActive ? 'Active' : 'Inactive'}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
							{user.lastLoginAt
								? new Date(user.lastLoginAt).toLocaleDateString()
								: 'Never'}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
							<button
								on:click={() => (editingUser = { ...user })}
								class="text-orange-400 hover:text-orange-300"
							>
								Edit
							</button>
							{#if user.id !== data.currentUserId}
								<form method="POST" action="?/toggleStatus" use:enhance class="inline">
									<input type="hidden" name="userId" value={user.id} />
									<button
										type="submit"
										class="{user.isActive ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}"
									>
										{user.isActive ? 'Deactivate' : 'Activate'}
									</button>
								</form>
								<button
									on:click={() => (showDeleteConfirm = user.id)}
									class="text-red-400 hover:text-red-300"
								>
									Delete
								</button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Edit/Add User Modal -->
{#if editingUser}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
		<div class="bg-black rounded-lg border border-orange-500/50 max-w-md w-full p-6">
			<h2 class="text-xl font-semibold text-white mb-4">
				{editingUser.id ? 'Edit User' : 'Add User'}
			</h2>

			<form
				method="POST"
				action="?/{editingUser.id ? 'updateUser' : 'createUser'}"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
						editingUser = null;
					};
				}}
			>
				{#if editingUser.id}
					<input type="hidden" name="userId" value={editingUser.id} />
				{/if}

				<div class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-300 mb-2">
							Name
						</label>
						<input
							type="text"
							id="name"
							name="name"
							bind:value={editingUser.name}
							required
							class="w-full px-3 py-2 bg-black border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
						/>
					</div>

					<div>
						<label for="email" class="block text-sm font-medium text-gray-300 mb-2">
							Email
						</label>
						<input
							type="email"
							id="email"
							name="email"
							bind:value={editingUser.email}
							required
							class="w-full px-3 py-2 bg-black border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
						/>
					</div>

					<div>
						<label for="role" class="block text-sm font-medium text-gray-300 mb-2">
							Role
						</label>
						<select
							id="role"
							name="role"
							bind:value={editingUser.role}
							class="w-full px-3 py-2 bg-black border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
						>
							<option value="IB">IB (Independent Broker)</option>
							<option value="ADMIN">Admin</option>
						</select>
					</div>

					{#if !editingUser.id}
						<div>
							<label for="password" class="block text-sm font-medium text-gray-300 mb-2">
								Password
							</label>
							<input
								type="password"
								id="password"
								name="password"
								required
								class="w-full px-3 py-2 bg-black border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
								placeholder="Temporary password"
							/>
						</div>
					{/if}
				</div>

				<div class="flex gap-2 mt-6">
					<button
						type="submit"
						disabled={loading}
						class="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-lg shadow-orange-500/50"
					>
						{loading ? 'Saving...' : editingUser.id ? 'Update' : 'Create'}
					</button>
					<button
						type="button"
						on:click={() => (editingUser = null)}
						class="px-4 py-2 bg-black hover:bg-orange-500/20 text-white rounded-lg transition-colors border border-orange-500/30"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
		<div class="bg-black rounded-lg border border-orange-500/50 max-w-md w-full p-6">
			<h2 class="text-xl font-semibold text-white mb-4">Confirm Delete</h2>
			<p class="text-gray-400 mb-6">
				Are you sure you want to delete this user? This action cannot be undone.
			</p>
			<div class="flex gap-2">
				<form method="POST" action="?/deleteUser" use:enhance class="flex-1">
					<input type="hidden" name="userId" value={showDeleteConfirm} />
					<button
						type="submit"
						class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
					>
						Delete
					</button>
				</form>
				<button
					on:click={() => (showDeleteConfirm = null)}
					class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
