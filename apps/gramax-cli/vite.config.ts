import { existsSync, readdirSync, rmSync, statSync } from "fs";
import { join, resolve } from "path";
import { defineConfig, mergeConfig, type Plugin, type UserConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import env from "../../scripts/compileTimeEnv.mjs";
import getOutputFileNames from "../../scripts/getOutputFileNames.js";
import browserConfig from "../browser/vite.config";

const { setVersion, setBuildVersion, dynamicModules } = env;

setVersion("static");
setBuildVersion("static");

const getAssetPath = (): string => {
	const isProduction = process.env.PRODUCTION === "true";
	const gramaxVersion = process.env.GRAMAX_NPM_VERSION || process.env.ASSETS_VERSION;

	if (isProduction && !gramaxVersion) throw new Error("GRAMAX_NPM_VERSION must be specified in production build");

	const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
	return `${process.env.ASSETS_VERSION ? "versioned-assets" : "assets"}/${gramaxVersion || `dev_${date}`}`;
};

export default defineConfig(async ({ isSsrBuild }) => {
	process.env.VITE_ENVIRONMENT = isSsrBuild ? "cli" : "static";

	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	browserConfig.plugins = browserConfig.plugins.filter((plugin) => (plugin as Plugin)?.name !== "create-zip-assets");

	if (isSsrBuild) {
		delete browserConfig.build.rollupOptions;
		delete browserConfig.resolve.alias["fs-extra"];
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		browserConfig.plugins = browserConfig.plugins.filter(
			(plugin) => (plugin as Plugin)?.name !== "vite-plugin-node-polyfills",
		);
	}

	const assetsDir = isSsrBuild ? undefined : getAssetPath();

	return mergeConfig(browserConfig, {
		resolve: {
			alias: dynamicModules(),
		},
		base: "",
		ssr: {
			noExternal: /^(?!shelljs$|graceful-fs$)/,
		},
		...(isSsrBuild ? { publicDir: "./public" } : { publicDir: false }),
		build: {
			emptyOutDir: !isSsrBuild,
			rollupOptions: {
				external: ["./package.json", "sharp", "canvas"],
				output: {
					importAttributesKey: "with",
					...(assetsDir ? getOutputFileNames(assetsDir) : {}),
				},
			},
			sourcemap: false,
			assetsDir,
		},
		plugins: [
			...(isSsrBuild
				? [
						{
							name: "clean-dist-except",
							buildStart() {
								const distPath = resolve(__dirname, "./dist");
								const protectedFolderName = "./bundle";
								const protectedFolderPath = resolve(distPath, protectedFolderName);

								try {
									if (!existsSync(distPath)) return;
									const filesAndFolders = readdirSync(distPath);
									filesAndFolders.forEach((item) => {
										const itemPath = join(distPath, item);
										if (itemPath !== protectedFolderPath) {
											const stats = statSync(itemPath);
											if (stats.isDirectory()) {
												rmSync(itemPath, { recursive: true, force: true });
											} else {
												rmSync(itemPath, { force: true });
											}
										}
									});
								} catch (err) {
									console.error(`Failed to clear dist folder: ${err.message}`);
								}
							},
						},
						viteStaticCopy({
							targets: [
								{
									src: "./src/package.json",
									dest: "./",
								},
							],
						}),
					]
				: [
						viteStaticCopy({
							targets: [
								{
									src: "../../core/public/favicon.ico",
									dest: "./",
								},
							],
						}),
					]),
		],
		define: {
			"process.builtIn": { READ_ONLY: "true", SERVER_APP: "true" },
			"process.env.VITE_ENVIRONMENT": JSON.stringify(process.env.VITE_ENVIRONMENT),
		},
	} as UserConfig);
});
