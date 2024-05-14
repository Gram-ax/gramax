import react from "@vitejs/plugin-react";
import { UserConfig, mergeConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import env from "../../scripts/compileTimeEnv.mjs";
import baseConfig from "../../vite.config";

const { setVersion } = env;

process.env.VITE_ENVIRONMENT = "browser";
setVersion("web");

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
} as UserConfig);
