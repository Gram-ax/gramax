import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default {
	plugins: {
		tailwindcss: { config: resolve(rootDir, "tailwind.config.js") },
		autoprefixer: {},
	},
};
