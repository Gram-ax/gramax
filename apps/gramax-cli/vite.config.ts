import { existsSync, readdirSync, rmSync, statSync } from "fs";
import { join, resolve } from "path";
import { defineConfig, mergeConfig, Plugin, UserConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import env from "../../scripts/compileTimeEnv.mjs";
import browserConfig from "../browser/vite.config";

const { setVersion, setBuildVersion } = env;

setVersion("static");
setBuildVersion("static");

export default defineConfig(({ isSsrBuild }) => {
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

	return mergeConfig(browserConfig, {
		base: "",
		ssr: {
			noExternal: /^(?!shelljs$|graceful-fs$)/,
		},
		build: {
			emptyOutDir: !isSsrBuild,
			rollupOptions: {
				external: ["./package.json", "sharp", "canvas"],
				output: {
					importAttributesKey: "with",
				},
			},
			sourcemap: false,
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
				: []),
		],
		define: {
			"process.builtIn": { READ_ONLY: "true", SERVER_APP: "true" },
			"process.env.VITE_ENVIRONMENT": JSON.stringify(process.env.VITE_ENVIRONMENT),
		},
	} as UserConfig);
});
