import NextBundleAnalyzer from "@next/bundle-analyzer";
import path from "path";
import { fileURLToPath } from "url";
import env from "../../scripts/compileTimeEnv.mjs";
import NextSourceMapUploader from "../../scripts/sourceMaps/NextSourceMapUploader.js";

env.setVersion("docportal");
env.setBuildVersion("next");

const withBundleAnalyzer = NextBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
});

const dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.PRODUCTION === "true";
const bugsnagOptions = {
	apiKey: process.env.BUGSNAG_API_KEY,
	appVersion: process.env.BUILD_VERSION,
};

if (isProduction) console.log("Build in production mode");

export default withBundleAnalyzer({
	experimental: {
		externalDir: true,
		// turbotrace: {
		// 	contextDirectory: path.join(dirname, '../../'),
		// 	logLevel: "info",
		// 	logAll: true,
		// 	logDetail: true
		// }
	},
	eslint: { dirs: ["../../"] },
	pageExtensions: ["tsx"],
	basePath: process.env.BASE_PATH ?? "",
	output: process.env.NEXT_OUTPUT_TYPE,
	// outputFileTracingRoot: process.env.NEXT_OUTPUT_TYPE ? path.join(dirname, '../../') : null,

	webpack: (config, _) => {
		if (isProduction) config.plugins.push(new NextSourceMapUploader(bugsnagOptions));
		config.devtool = isProduction ? "source-map" : "eval";
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
			"@core": path.resolve(dirname, "../../core/logic"),
			"@ext": path.resolve(dirname, "../../core/extensions"),
			"@app": path.resolve(dirname, "../../app"),
		};

		config.optimization.minimize = false;
		return config;
	},
});
