import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { UserConfig, mergeConfig } from "vite";
import baseConfig from "../../vite.config";

process.env.VITE_ENVIRONMENT = "tauri";

export default mergeConfig(baseConfig(), {
	plugins: [react()],

	resolve: {
		alias: {
			"fs-extra": fileURLToPath(new URL("../../target/tauri/src/tauri", import.meta.url)),
		},
	},

	build: {
		rollupOptions: {
			input: {
				index: path.resolve(__dirname, "index.html"),
				settings: path.resolve(__dirname, "settings.html"),
			},
		},
	},

	publicDir: "../../core/public",
	envDir: "../..",
} as UserConfig);
