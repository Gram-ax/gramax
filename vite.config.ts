import react from "@vitejs/plugin-react";
import { networkInterfaces } from "os";
import path from "path";
import { UserConfig, defineConfig, searchForWorkspaceRoot } from "vite";
import ifdef from "vite-plugin-conditional-compiler";
import { nodePolyfills as polyfills } from "vite-plugin-node-polyfills";
import env from "./scripts/compileTimeEnv.mjs";

const { getBuiltInVariables } = env;

const ipv4 = networkInterfaces()?.en0?.[1]?.address ?? "localhost";

export default defineConfig((): UserConfig => {
	return {
		cacheDir: ".vite-cache",
		logLevel: "info",
		appType: "spa",

		plugins: [
			react(),
			ifdef(),
			polyfills({
				protocolImports: false,
			}),
		],

		clearScreen: false,

		resolve: {
			alias: {
				"@components": path.resolve(__dirname, "core/components"),
				"@core": path.resolve(__dirname, "core/logic"),
				"@core-ui": path.resolve(__dirname, "core/ui-logic"),
				"@ext": path.resolve(__dirname, "core/extensions"),
				"@app": path.resolve(__dirname, "app"),
				"@services": path.resolve(__dirname, "services/core"),
				"@app-plugins/git": path.resolve(__dirname, "target/tauri/plugins/plugin-gramax-git/webview-src"),
			},
		},

		server: {
			sourcemapIgnoreList: (path) => path.includes("node_modules"),
			open: false,
			host: "localhost",
			port: 5173,
			strictPort: true,
			hmr: {
				protocol: "ws",
				host: ipv4,
				port: 5174,
			},
			fs: {
				allow: [path.join(searchForWorkspaceRoot(process.cwd(), "../../"))],
			},
		},

		define: { "process.builtIn": getBuiltInVariables(), "process.env.NODE_DEBUG": false },
		publicDir: "./core/public",
		envPrefix: ["VITE", "TAURI", "GX"],

		build: {
			emptyOutDir: true,
			modulePreload: true,
			outDir: "dist",
			rollupOptions: {
				external: ["fsevents"],
			},
			minify: !process.env.GX_DEBUG || !process.env.TAURI_DEBUG,
			sourcemap: !!process.env.GX_DEBUG || !!process.env.TAURI_DEBUG,
		},
	};
});
