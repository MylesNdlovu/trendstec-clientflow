import { writable } from 'svelte/store';

export interface User {
	id: string;
	email: string;
	name: string | null;
	role: string;
}

export const userStore = writable<User | null>(null);
export const isAuthenticated = writable<boolean>(false);