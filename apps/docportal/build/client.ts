import type { BuildConfig } from "bun";
import path from "path";
import { fileURLToPath } from "url";
import isProduction from "../../../scripts/isProduction.mjs";
import { browserAssertPlugin } from "./plugins/client/browserAssertPlugin";
import { copyFaviconPlugin } from "./plugins/client/copyFaviconPlugin";
import { fixBrokenChunkExports } from "./plugins/client/fixBrokenChunkExports";
import { lucideNoTreeShakePlugin } from "./plugins/client/lucideNoTreeShakePlugin";
import { processStubPlugin } from "./plugins/client/processStubPlugin";
import replaceImportPlugin from "./plugins/replaceImportPlugin";

export const dirname = path.dirname(fileURLToPath(import.meta.url));

type BuildOptions = BuildConfig & {
	metafile: string;
};

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

const root = path.resolve(dirname, "../../..");

const { default: postcss } = await import("tailwindcss/node_modules/postcss/lib/postcss.js");
const { default: tailwindcss } = await import("tailwindcss");
const { default: autoprefixer } = await import("autoprefixer");
const { default: tailwindConfig } = await import(path.join(root, "tailwind.config.js"));

const uiKitCss = path.join(root, "core/ui-kit/index.css");
const themeCss = await Bun.file(path.join(root, "node_modules/ics-ui-kit/dist/theme.css")).text();
const cssInput = `${themeCss}\n${await Bun.file(uiKitCss).text()}`;
// biome-ignore lint/suspicious/noExplicitAny: postcss version conflict between tailwindcss bundled and root
const postcssResult = await (postcss as any)([tailwindcss(tailwindConfig), autoprefixer]).process(cssInput, {
	from: uiKitCss,
	to: path.resolve(dirname, "../dist/assets/tailwind.css"),
});

await Bun.write(path.resolve(dirname, "../dist/assets/tailwind.css"), postcssResult.css);
