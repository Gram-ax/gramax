import react from "@vitejs/plugin-react";
import { mergeConfig, type UserConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import env from "../../scripts/compileTimeEnv.mjs";
import getOutputFileNames from "../../scripts/getOutputFileNames";
import baseConfig from "../../vite.config";

const { setVersion, setBuildVersion, dynamicModules } = env;

process.env.VITE_ENVIRONMENT = "browser";
setVersion("web");
setBuildVersion("browser");

export default mergeConfig(baseConfig(), {
	plugins: [mkcert(), react()],
	publicDir: "../../core/public",
	server: {
		hmr: {
			protocol: "wss",
		},
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp",
		},
	},
	envDir: "../..",
	build: {
		resolve: {
			alias: dynamicModules(),
		},
		rollupOptions: {
			output: getOutputFileNames(),
		},
	},
} as UserConfig);
