import type { BuildConfig } from "bun";
import path from "path";
import { fileURLToPath } from "url";
import isProduction from "../../../scripts/isProduction.mjs";
import replaceImportPlugin from "./plugins/replaceImportPlugin";
import { fixBrokenChunkExports } from "./plugins/client/fixBrokenChunkExports";
import { lucideNoTreeShakePlugin } from "./plugins/client/lucideNoTreeShakePlugin";
import { browserAssertPlugin } from "./plugins/client/browserAssertPlugin";
import { processStubPlugin } from "./plugins/client/processStubPlugin";
import { copyFaviconPlugin } from "./plugins/client/copyFaviconPlugin";

export const dirname = path.dirname(fileURLToPath(import.meta.url));

type BuildOptions = BuildConfig & {
	metafile: string;
}

const result = await Bun.build({ 
	metafile: "../meta.json",
	entrypoints: ["client/index.tsx", "client/Admin.tsx"],
	outdir: "dist/assets",
	target: "browser",
	format: "esm",
	splitting: true,
	minify: true,
	publicPath: "/assets/",
	sourcemap: isProduction() ? "none" : "inline",
	naming: {
		chunk: "[name]-[hash].[ext]",
		asset: "[name]-[hash].[ext]",
	},
	define: {
		global: "window",
		process: JSON.stringify({
			version: [],
			builtIn: [],
			env: { NODE_DEBUG: false, VITE_ENVIRONMENT: "docportal" },
		}),
	},
	plugins: [
		replaceImportPlugin(dirname),
		lucideNoTreeShakePlugin(dirname),
		processStubPlugin(),
		browserAssertPlugin(),
		copyFaviconPlugin(dirname),
	],
} as BuildOptions);

if (!result.success) {
	for (const log of result.logs) console.error(log);
	process.exit(1);
}

fixBrokenChunkExports(path.resolve(process.cwd(), "dist/assets"));


