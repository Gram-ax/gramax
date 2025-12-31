#!/usr/bin/env node
/**
 * Build script for plugin SDK
 *
 * Creates a self-contained ESM bundle of the SDK for Next.js production.
 */

import { build } from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, rmSync, copyFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../..");

const PATHS = {
	entry: resolve(ROOT_DIR, "core/plugins/api/sdk/index.ts"),
	outDir: resolve(ROOT_DIR, "core/public/plugins"),
	outFile: "sdk.js",
	nextPublicDir: resolve(ROOT_DIR, "core/public/plugins"),
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
};

async function buildPluginSdk() {
	console.log("[Plugin SDK] Building SDK bundle...");

	rmSync(PATHS.outDir, { recursive: true, force: true });
	mkdirSync(PATHS.outDir, { recursive: true });

	await build(BUILD_CONFIG);

	console.log(`[Plugin SDK] ✓ Built  → ${BUILD_CONFIG.outfile}`);

	// Copy to Next.js public folder
	mkdirSync(PATHS.nextPublicDir, { recursive: true });
	copyFileSync(resolve(PATHS.outDir, PATHS.outFile), resolve(PATHS.nextPublicDir, PATHS.outFile));
}

buildPluginSdk().catch((error) => {
	console.error("[Plugin SDK] ✗ Build failed:", error.message);
	process.exit(1);
});
