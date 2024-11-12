import { networkInterfaces } from "os";
import * as path from "path";
import { Plugin, UserConfig, searchForWorkspaceRoot } from "vite";
import ifdef from "vite-plugin-conditional-compiler";
import { nodePolyfills as polyfills } from "vite-plugin-node-polyfills";
import env from "./scripts/compileTimeEnv.mjs";
import ViteSourceMapUploader from "./scripts/sourceMaps/ViteSourceMapUploader.mjs";

const { getBuiltInVariables } = env;
if (!process.env.VITE_ENVIRONMENT) process.env.VITE_ENVIRONMENT = "next";

const isProduction = process.env.PRODUCTION === "true";
const ipv4 = networkInterfaces()?.en0?.[1]?.address ?? "localhost";
import { createHtmlPlugin } from "vite-plugin-html";
import fs from "fs";

// https://github.com/vitejs/vite/issues/15012
const muteWarningsPlugin = (warningsToIgnore: string[][]): Plugin => {
	return {
		name: "mute-warnings",
		enforce: "pre",
		config: (userConfig) => ({
			build: {
				rollupOptions: {
					onwarn(warning, defaultHandler) {
						if (warning.code) {
							const muted = warningsToIgnore.find(
								([code, message]) => code == warning.code && warning.message.includes(message),
							);
							if (muted) return;
						}

						if (userConfig.build?.rollupOptions?.onwarn) {
							userConfig.build.rollupOptions.onwarn(warning, defaultHandler);
						} else {
							defaultHandler(warning);
						}
					},
				},
			},
		}),
	};
};

export default (): UserConfig => ({
	cacheDir: ".vite-cache",
	logLevel: "info",
	appType: "spa",

	plugins: [
		muteWarningsPlugin([
			["MODULE_LEVEL_DIRECTIVE", `"use-client"`],
			["EVAL", "Use of eval"],
		]),
		ifdef(),
		polyfills({
			protocolImports: true,
			exclude: ["buffer"],
		}),
		isProduction && process.env.BUGSNAG_API_KEY && process.env.BUILD_VERSION && ViteSourceMapUploader(),
		createHtmlPlugin({
			inject: {
				data: {
					criticalStyle: `<style>${readFileAsString("core/styles/base.css")}</style>`,
					vars: `<style>${readFileAsString("core/styles/vars.css")}</style>`,
					themes: `<style>${readFileAsString("core/styles/themes.css")}</style>`,
					bodyDatasetInjector: `<script>${readFileAsString(
						"scripts/browser/bodyDatasetInjector.js",
					)}</script>`,
					tryOpenInDesktop: `<script>${readFileAsString("scripts/browser/tryOpenInDesktop.js")}</script>`,
				},
			},

			minify: false,
			entry: "",
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
			"fs-extra": path.resolve(__dirname, "core/logic/FileProvider/DiskFileProvider/DFPIntermediateCommands.ts"),
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

	define: {
		"process.version": [], // https://github.com/browserify/browserify-sign/issues/85
		"process.builtIn": getBuiltInVariables(),
		"process.env.NODE_DEBUG": false,
	},
	publicDir: "./core/public",
	envPrefix: ["VITE", "TAURI", "GX"],

	worker: {
		format: "es",
	},

	build: {
		target: "esnext",
		emptyOutDir: true,
		modulePreload: true,
		chunkSizeWarningLimit: 5000,
		outDir: "dist",
		rollupOptions: {
			external: ["fsevents"],
		},
		minify: true,
		sourcemap: isProduction,
	},
});

function readFileAsString(filePath: string) {
	return fs.readFileSync(path.resolve(__dirname, filePath), "utf-8");
}
