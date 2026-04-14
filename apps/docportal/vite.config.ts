import react from "@vitejs/plugin-react";
import { mergeConfig } from "vite";
import baseConfig from "../../vite.config";

export default mergeConfig(baseConfig(), {
	plugins: [react()],
	build: {
		outDir: "dist/client",
		emptyOutDir: true,
		rollupOptions: {
			input: "client/index.tsx",
			output: {
				entryFileNames: "assets/index.js",
				chunkFileNames: "assets/[name]-[hash].js",
				assetFileNames: "assets/[name]-[hash][extname]",
			},
		},
	},
});
