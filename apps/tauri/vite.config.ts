import react from "@vitejs/plugin-react";
import path from "path";
import { UserConfig, mergeConfig } from "vite";
import webfontDownload from "vite-plugin-webfont-dl";
import env from "../../scripts/compileTimeEnv.mjs";
import baseConfig from "../../vite.config";

process.env.VITE_ENVIRONMENT = "tauri";

const { setBuildVersion } = env;
setBuildVersion("tauri");

export default mergeConfig(baseConfig(), {
	plugins: [react(), webfontDownload()],

	build: {
		rollupOptions: {
			output: {
				sourcemapBaseUrl: "https://dev.gram.ax",
			},
			input: {
				index: path.resolve(__dirname, "index.html"),
			},
		},
	},

	// server: {
	// 	hmr: false,
	// },

	publicDir: "../../core/public",
	envDir: "../..",
} as UserConfig);
