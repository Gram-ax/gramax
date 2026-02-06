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
const uploadSourceMapsToBugsnag = process.env.UPLOAD_SOURCE_MAPS_TO_BUGSNAG === "true";

const bugsnagOptions = {
	apiKey: process.env.BUGSNAG_API_KEY,
	appVersion: process.env.BUILD_VERSION,
	overwrite: true,
};

if (isProduction) console.log("Build in production mode");
if (isProduction && uploadSourceMapsToBugsnag) console.log("Upload source maps to Bugsnag");

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

	transpilePackages: ["monaco-editor", "mdt-charts"],

	webpack: (config, { webpack }) => {
		if (isProduction && uploadSourceMapsToBugsnag) config.plugins.push(new NextSourceMapUploader(bugsnagOptions));
		config.devtool = isProduction ? "source-map" : "eval-source-map";

		config.plugins.push(
			new webpack.IgnorePlugin({
				resourceRegExp: /^node:/,
			}),
			new webpack.NormalModuleReplacementPlugin(
				/@app\/resolveModule\/frontend$/,
				path.resolve(dirname, "../../app/resolveModule/frontend/next.ts"),
			),
			new webpack.NormalModuleReplacementPlugin(
				/@app\/resolveModule\/backend$/,
				path.resolve(dirname, "../../app/resolveModule/backend/next.ts"),
			),
		);

		config.resolve.fallback = {
			...config.resolve.fallback,
			path: false,
			os: false,
			child_process: false,
			worker_threads: false,
			module: false,
		};

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
			"@ui-kit": path.resolve(dirname, "../../core/ui-kit/components"),
			"@public": path.resolve(dirname, "../../core/public"),
			"@plugins": path.resolve(dirname, "../../core/plugins"),
			"@core": path.resolve(dirname, "../../core/logic"),
			"@ext": path.resolve(dirname, "../../core/extensions"),

			"@app": path.resolve(dirname, "../../app"),
			"./frontend/browser": path.resolve(dirname, "empty.mjs"),
			"./frontend/tauri": path.resolve(dirname, "empty.mjs"),
			"./frontend/static": path.resolve(dirname, "empty.mjs"),
			"./frontend/cli": path.resolve(dirname, "empty.mjs"),
			"./backend/browser": path.resolve(dirname, "empty.mjs"),
			"./backend/tauri": path.resolve(dirname, "empty.mjs"),
			"./backend/static": path.resolve(dirname, "empty.mjs"),
			"./backend/cli": path.resolve(dirname, "empty.mjs"),
		};

		config.plugins.push(
			new webpack.DefinePlugin({
				"global.VITE_ENVIRONMENT": JSON.stringify("next"),
			}),
		);

		config.output.devtoolModuleFilenameTemplate = (info) => {
			return path.resolve(info.absoluteResourcePath).replace(/\\/g, "/");
		};

		config.optimization.minimize = false;
		return config;
	},
});
