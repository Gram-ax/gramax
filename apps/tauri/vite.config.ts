import react from "@vitejs/plugin-react";
import path from "path";
import { mergeConfig, type UserConfig } from "vite";
import webfontDownload from "vite-plugin-webfont-dl";
import env from "../../scripts/compileTimeEnv.mjs";
import baseConfig from "../../vite.config";

process.env.VITE_ENVIRONMENT = "tauri";

const { setBuildVersion, dynamicModules } = env;
setBuildVersion("tauri");

export default mergeConfig(baseConfig(), {
	plugins: [react(), webfontDownload()],

	build: {
		resolve: {
			alias: dynamicModules(),
		},
		rollupOptions: {
			input: {
				index: path.resolve(__dirname, "index.html"),
			},
		},
	},

	server: {
		hmr: false,
	},

	publicDir: "../../core/public",
	envDir: "../..",
} as UserConfig);
