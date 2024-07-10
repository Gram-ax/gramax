import react from "@vitejs/plugin-react";
import { UserConfig, mergeConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import env from "../../scripts/compileTimeEnv.mjs";
import baseConfig from "../../vite.config";

const { setVersion, setBuildVersion } = env;

process.env.VITE_ENVIRONMENT = "browser";
setVersion("web");
setBuildVersion("browser");

const nonHashableNames = ["FileInputBundle", "markdown", "jszip.min", "SwaggerUI"];

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
		rollupOptions: {
			output: {
				entryFileNames: (chunkInfo) => {
					if (nonHashableNames.includes(chunkInfo.name)) return "assets/[name].js";
					return "assets/[name]-[hash].js";
				},
				chunkFileNames: (chunkInfo) => {
					if (nonHashableNames.includes(chunkInfo.name)) return "assets/[name].js";
					return "assets/[name]-[hash].js";
				},
				assetFileNames: (assetInfo) => {
					if (nonHashableNames.includes(assetInfo.name.replace(".css", ""))) return "assets/[name][extname]";
					return "assets/[name]-[hash][extname]";
				},
			},
		},
	},
} as UserConfig);
