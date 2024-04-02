import NextBundleAnalyzer from "@next/bundle-analyzer";
import path from "path";
import { fileURLToPath } from "url";
import env from "../../scripts/compileTimeEnv.mjs";

env.setVersion("static");

const withBundleAnalyzer = NextBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
});

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Неочевидно, надо переделать, вынести в отдельную функцию
const pluginCachePath = path.resolve(process.env.USER_DATA_PATH ?? process.env.ROOT_PATH, ".storage/plugins");

export default withBundleAnalyzer({
	experimental: { externalDir: true },
	eslint: { dirs: ["../../"], ignoreDuringBuilds: true },
	typescript: { ignoreBuildErrors: true },
	pageExtensions: ["tsx"],
	basePath: process.env.BASE_PATH ?? "",

	webpack: (config, _) => {
		config.devtool = "eval";
		config.module.rules.push({
			test: /\.tsx?$/,
			exclude: /node_modules/,
			use: [{ loader: "ifdef-loader", options: { VITE_ENVIRONMENT: "next" } }],
		});
		config.module.rules.push({
			test: /\.node$/,
			use: [
				{
					loader: "nextjs-node-loader",
					options: {
						outputPath: config.output.path,
					},
				},
			],
		});
		config.resolve.alias = {
			...config.resolve.alias,
			"@core-ui": path.resolve(dirname, "../../../core/ui-logic"),
			"@components": path.resolve(dirname, "../../core/components"),
			"@public": path.resolve(dirname, "../../core/public"),
			"@pluginCache": pluginCachePath,
			"@core": path.resolve(dirname, "../../core/logic"),
			"@ext": path.resolve(dirname, "../../core/extensions"),
			"@app": path.resolve(dirname, "../../app"),
		};

		config.optimization.minimize = false;
		return config;
	},
});
