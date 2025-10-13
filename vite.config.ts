import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		headers: {
			'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
			'Pragma': 'no-cache',
			'Expires': '0'
		},
		fs: {
			strict: false
		},
		host: true,
		allowedHosts: ['tender-lies-sleep.loca.lt', '.loca.lt'],
		hmr: {
			clientPort: 443
		}
	}
});
