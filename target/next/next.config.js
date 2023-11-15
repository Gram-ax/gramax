import NextBundleAnalyzer from "@next/bundle-analyzer";
import path from "path";
import { fileURLToPath } from "url";
import env from "../../scripts/compileTimeEnv.mjs";

env.setVersion("static");

const withBundleAnalyzer = NextBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
});

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default withBundleAnalyzer({
	experimental: { externalDir: true },
	eslint: { dirs: ["../../"] },
	pageExtensions: ["tsx"],
	basePath: process.env.BASE_PATH ?? "",

	webpack: (config, _) => {
		config.module.rules.push({
			test: /\.tsx?$/,
			exclude: /node_modules/,
			use: [{ loader: "ifdef-loader", options: { VITE_ENVIRONMENT: "next" } }],
		});
		config.module.rules.push({
			test: /.node$/,
			loader: "node-loader",
		});

		config.resolve.alias = {
			...config.resolve.alias,
			"@core-ui": path.resolve(dirname, "../../../core/ui-logic"),
			"@components": path.resolve(dirname, "../../core/components"),
			"@core": path.resolve(dirname, "../../core/logic"),
			"@ext": path.resolve(dirname, "../../core/extensions"),
			"@app": path.resolve(dirname, "../../app"),
		};

		config.optimization.minimize = false;
		return config;
	},
});
