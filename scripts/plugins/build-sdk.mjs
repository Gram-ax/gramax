#!/usr/bin/env node
/**
 * Build script for plugin SDK
 *
 * Creates a self-contained ESM bundle of the SDK for Next.js production.
 */

import { build } from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { cpSync, existsSync, lstatSync, mkdirSync, rmSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../..");

const PATHS = {
	entry: resolve(ROOT_DIR, "core/plugins/api/sdk/index.ts"),
	corePublicDir: resolve(ROOT_DIR, "core/public"),
	nextPublicDir: resolve(ROOT_DIR, "apps/next/public"),
	outDir: resolve(ROOT_DIR, "core/public/plugins"),
	outFile: "sdk.js",
	// Vendored so plugins load it same-origin (COEP: require-corp blocks a cross-origin CDN
	// <script>, and it must work behind an authenticating proxy / offline). Lives outside outDir,
	// which is wiped on each build, and is copied in beside sdk.js.
	esmShimVendor: resolve(ROOT_DIR, "scripts/plugins/vendor/es-module-shims.js"),
	esmShimFile: "es-module-shims.js",
};

const BUILD_CONFIG = {
	entryPoints: [PATHS.entry],
	bundle: true,
	format: "esm",
	platform: "browser",
	target: ["es2020"],
	outfile: resolve(PATHS.outDir, PATHS.outFile),
	treeShaking: true,
	logLevel: "info",
	// The SDK bundle drags in app code (resolveModule/env, settings, localization) that reads
	// `global`/`process` at module load. The host page defines neither for a plain esbuild bundle,
	// so `@app/resolveModule/env` threw "process is not defined" on every plugin import, silently
	// breaking plugin loading. The main app bundles inject the same globals; mirror that here.
	// VITE_ENVIRONMENT is "web": the SDK always runs in a browser and reads runtime config through
	// the host-provided window.getEnv, so this only feeds env.ts's boot-time assert.
	define: {
		global: "globalThis",
		process: JSON.stringify({ env: { VITE_ENVIRONMENT: "web", NODE_ENV: "production" }, builtIn: {} }),
	},
};

function syncNextPublicDir() {
	if (existsSync(PATHS.nextPublicDir)) {
		const stats = lstatSync(PATHS.nextPublicDir);

		if (stats.isSymbolicLink()) return;

		if (!stats.isDirectory()) {
			rmSync(PATHS.nextPublicDir, { force: true });
		}
	}

	mkdirSync(PATHS.nextPublicDir, { recursive: true });
	cpSync(PATHS.corePublicDir, PATHS.nextPublicDir, { recursive: true, force: true });
}

async function buildPluginSdk() {
	console.log("[Plugin SDK] Building SDK bundle...");

	rmSync(PATHS.outDir, { recursive: true, force: true });
	mkdirSync(PATHS.outDir, { recursive: true });

	await build(BUILD_CONFIG);

	console.log(`[Plugin SDK] ✓ Built  → ${BUILD_CONFIG.outfile}`);

	const esmShimOut = resolve(PATHS.outDir, PATHS.esmShimFile);
	cpSync(PATHS.esmShimVendor, esmShimOut, { force: true });
	console.log(`[Plugin SDK] ✓ Copied → ${esmShimOut}`);

	syncNextPublicDir();
}

buildPluginSdk().catch((error) => {
	console.error("[Plugin SDK] ✗ Build failed:", error.message);
	process.exit(1);
});
