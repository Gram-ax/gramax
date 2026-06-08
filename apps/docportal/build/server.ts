import path from "path";
import { fileURLToPath } from "url";
import isProduction from "../../../scripts/isProduction.mjs";
import replaceImportPlugin from "./plugins/replaceImportPlugin";
import { reactSSRLayoutEffectPlugin } from "./plugins/server/reactSSRLayoutEffectPlugin";

const dirname = path.dirname(fileURLToPath(import.meta.url));

Bun.build({
	entrypoints: [
		"server/index.ts",
		"server/search/modulith/modulithSearch.bun.worker.ts",
		"server/search/modulith/resourceParse.bun.worker.ts",
	],
	outdir: "dist",
	target: "node",
	sourcemap: isProduction() ? "none" : "inline",
	define: {
		"process.env.VITE_ENVIRONMENT": JSON.stringify("docportal"),
	},
	plugins: [replaceImportPlugin(dirname), reactSSRLayoutEffectPlugin()],
});
