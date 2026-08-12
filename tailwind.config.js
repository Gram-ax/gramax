// tailwind.config.js
// biome-ignore lint/style/noRestrictedImports: expected
import icsPreset from "ics-ui-kit/tailwind.preset";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
	presets: [icsPreset],
	content: [
		resolve(root, "core/**/*.{ts,tsx}"),
		resolve(root, "app/**/*.{ts,tsx}"),
		resolve(root, "apps/**/*.{ts,tsx}"),
		resolve(root, "node_modules/ics-ui-kit/dist/**/*.js"),
	],
	theme: {
		extend: {
			colors: {
				status: {
					purple: {
						DEFAULT: "hsl(var(--status-purple))",
						"primary-bg": "hsl(var(--status-purple-primary-bg))",
					},
				},
			},
			animation: {
				"wifi-pulse": "wifi-pulse 1.5s cubic-bezier(.65,.815,.735,.395) infinite",
			},
			keyframes: {
				"wifi-pulse": {
					"0%": { opacity: "0.5" },
					"33%": { opacity: "0.5" },
					"66%": { opacity: "1" },
					"100%": { opacity: "0.5" },
				},
			},
		},
	},
};
