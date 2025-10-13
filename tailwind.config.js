/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				'bg-primary': 'rgb(var(--bg-primary) / <alpha-value>)',
				'bg-secondary': 'rgb(var(--bg-secondary) / <alpha-value>)',
				'bg-tertiary': 'rgb(var(--bg-tertiary) / <alpha-value>)',
				'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
				'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
				'text-tertiary': 'rgb(var(--text-tertiary) / <alpha-value>)',
				'accent-primary': 'rgb(var(--accent-primary) / <alpha-value>)',
				'accent-secondary': 'rgb(var(--accent-secondary) / <alpha-value>)',
			},
			backdropBlur: {
				'xs': '2px',
			},
			animation: {
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'slide-up': 'slideUp 0.3s ease-out',
				'scale-up': 'scaleUp 0.2s ease-out',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideUp: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				scaleUp: {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
			},
		}
	},
	plugins: []
};