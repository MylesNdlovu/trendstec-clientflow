import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ColorScheme = 'cyan' | 'orange' | 'green';

export interface ThemeConfig {
	accentColor: ColorScheme;
	primary: string;
	secondary: string;
	name: string;
}

const colorSchemes: Record<ColorScheme, ThemeConfig> = {
	cyan: {
		accentColor: 'cyan',
		primary: '#22d3ee', // cyan-400
		secondary: '#3b82f6', // blue-500
		name: 'Tron Blue'
	},
	orange: {
		accentColor: 'orange',
		primary: '#fb923c', // orange-400
		secondary: '#ef4444', // red-500
		name: 'Vibrant Orange'
	},
	green: {
		accentColor: 'green',
		primary: '#4ade80', // green-400
		secondary: '#10b981', // emerald-500
		name: 'Hacker Green'
	}
};

// Default theme
const defaultTheme: ThemeConfig = colorSchemes.orange;

// Load theme from localStorage if available
function loadTheme(): ThemeConfig {
	if (browser) {
		try {
			const saved = localStorage.getItem('app-theme');
			if (saved) {
				const parsed = JSON.parse(saved);
				const accentColor = parsed.accentColor as ColorScheme;
				return colorSchemes[accentColor] || defaultTheme;
			}
		} catch (error) {
			console.error('Failed to load theme from localStorage:', error);
		}
	}
	return defaultTheme;
}

// Create the theme store
export const theme = writable<ThemeConfig>(defaultTheme);

// Initialize theme from localStorage
if (browser) {
	const savedTheme = loadTheme();
	theme.set(savedTheme);
	console.log('Loaded theme:', savedTheme);
} else {
	theme.set(defaultTheme);
}

// Save theme to localStorage when it changes
theme.subscribe((value) => {
	if (browser) {
		try {
			localStorage.setItem('app-theme', JSON.stringify(value));
			// Update CSS custom properties for dynamic theming
			document.documentElement.style.setProperty('--color-primary', value.primary);
			document.documentElement.style.setProperty('--color-secondary', value.secondary);
		} catch (error) {
			console.error('Failed to save theme to localStorage:', error);
		}
	}
});

// Helper function to set theme
export function setTheme(colorScheme: ColorScheme) {
	const newTheme = colorSchemes[colorScheme];
	if (newTheme) {
		theme.set(newTheme);
		console.log('Theme changed to:', colorScheme, newTheme);
	}
}

// Helper function to reset theme to default
export function resetTheme() {
	if (browser) {
		localStorage.removeItem('app-theme');
	}
	theme.set(defaultTheme);
	console.log('Theme reset to default:', defaultTheme);
}

// Helper function to get CSS classes for current theme
export function getThemeClasses(currentTheme: ThemeConfig) {
	const base = currentTheme.accentColor;
	return {
		// Use inline style for color to ensure consistency
		primary: `text-[${currentTheme.primary}]`,
		primaryStyle: `color: ${currentTheme.primary}`,
		primaryBg: `bg-[${currentTheme.primary}]`,
		primaryBgStyle: `background-color: ${currentTheme.primary}`,
		primaryBgHover: `hover:bg-${base}-500`,
		primaryBorder: `border-[${currentTheme.primary}]`,
		primaryBorderStyle: `border-color: ${currentTheme.primary}`,
		primaryRing: `focus:ring-${base}-400/50`,
		focusRing: `focus:ring-${base}-400/50`,
		focusBorder: `focus:border-${base}-400`,
		primaryGradient: base === 'cyan' ? 'from-cyan-500 to-blue-600' :
						 base === 'orange' ? 'from-orange-500 to-red-600' :
						 'from-green-500 to-emerald-600',
		primaryGradientHover: base === 'cyan' ? 'hover:from-cyan-600 hover:to-blue-700' :
							  base === 'orange' ? 'hover:from-orange-600 hover:to-red-700' :
							  'hover:from-green-600 hover:to-emerald-700',
		primaryShadow: `shadow-${base}-500/25`,
		secondary: `text-[${currentTheme.secondary}]`,
		secondaryStyle: `color: ${currentTheme.secondary}`
	};
}

// Matt black colors to replace navy blue
export const mattBlackColors = {
	bg: '#070303', // Main contrast color - dark for cards
	card: '#000000', // Super black card backgrounds
	border: '#333333', // Border color
	text: '#e0e0e0', // Text color
	textMuted: '#9e9e9e' // Muted text
};

export { colorSchemes };