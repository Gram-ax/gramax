// tailwind.config.js
// biome-ignore lint/style/noRestrictedImports: expected
import icsPreset from "ics-ui-kit/tailwind.preset";
import { dirname, resolve } from "path";
import colors from "tailwindcss/colors";
import plugin from "tailwindcss/plugin";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));

const colorVarsPlugin = plugin(({ addBase }) => {
	addBase({
		":root": {
			"--color-purple-50": colors.purple[50],
			"--color-purple-700": colors.purple[700],
		},
		".dark": {
			"--color-purple-50": "hsl(var(--status-success-bg))",
			"--color-purple-700": colors.purple[400],
		},
	});
});

/** @type {import('tailwindcss').Config} */
export default {
	presets: [icsPreset],
	plugins: [colorVarsPlugin],
	content: [
		resolve(root, "core/**/*.{ts,tsx}"),
		resolve(root, "app/**/*.{ts,tsx}"),
		resolve(root, "apps/**/*.{ts,tsx}"),
		resolve(root, "node_modules/ics-ui-kit/dist/**/*.js"),
	],
	theme: {
		extend: {
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
