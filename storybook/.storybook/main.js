const webpack = require("webpack");
const path = require("path");

module.exports = {
	stories: ["../stories/**/*.stories.tsx"],
	framework: {
		name: "@storybook/react-webpack5",
		options: { fastRefresh: true },
	},
	addons: [
		"@storybook/preset-create-react-app",
		"@storybook/addon-docs",
		"@storybook/addon-viewport",
		"@storybook/addon-controls",
		"@storybook/addon-outline",
		"@storybook/addon-toolbars",
	],
	staticDirs: ["../public"],
	webpackFinal: async (config) => {
		const crypto = require("crypto");
		const crypto_orig_createHash = crypto.createHash;
		crypto.createHash = (algorithm) => crypto_orig_createHash(algorithm == "md4" ? "sha256" : algorithm);

		config.output.filename = "[name].[contenthash].js";
		config.plugins.push(new webpack.DefinePlugin({ process: { env: JSON.stringify(process.env) } }));
		config.plugins.push(new webpack.ProvidePlugin({ React: "react" }));
		config.resolve.fallback.util = require.resolve("util/");
		config.resolve.extensions = [".tsx", ".ts", ".js", ".jsx"];
		config.resolve.alias = {
			...config.resolve.alias,
			"fs-extra": false,
			fs: false,
			"@components": path.resolve(__dirname, "../../core/components"),
			"@core": path.resolve(__dirname, "../../core/logic"),
			"@core-ui": path.resolve(__dirname, "../../core/ui-logic"),
			"@ext": path.resolve(__dirname, "../../core/extensions"),
			"@app": path.resolve(__dirname, "../../app"),
		};

		config.module.rules.push({
			test: /\.(js|jsx|ts|tsx)$/,
			exclude: /node_modules/,
			use: {
				loader: "babel-loader",
				options: {
					presets: ["@babel/preset-react", "@babel/preset-typescript"],
				},
			},
		});

		config.module.rules.push({
			test: /\.ts$/,
			use: {
				loader: "ifdef-loader",
				options: {
					VITE_ENVIRONMENT: "next",
					"ifdef-verbose": true, // add this line for verbose output
					"ifdef-triple-slash": true, // add this line to use double slash comment instead of default triple slash
				},
			},
		});

		config.resolve.fallback.crypto = require.resolve("crypto-browserify");

		return config;
	},
};
