/* global process */
import glob from "fast-glob";
import { unlinkSync } from "fs";
import * as path from "path";
import { BugsnagSourceMapUploaderPlugin } from "vite-plugin-bugsnag";

/**
 * @typedef {import('vite').Plugin} Plugin
 */

/**
 * @returns {Plugin}
 */
const ViteSourceMapUploader = () => {
	const bugsnagSourceMapUploader = BugsnagSourceMapUploaderPlugin({
		apiKey: process.env.BUGSNAG_API_KEY,
		appVersion: process.env.BUILD_VERSION,
	});
	return {
		...bugsnagSourceMapUploader,
		async writeBundle(config, bundle) {
			const outputDir = config.dir;
			try {
				await bugsnagSourceMapUploader.writeBundle(config, bundle);
			} catch (e) {
				console.error(e);
			} finally {
				const files = await glob("./**/*.map", { cwd: outputDir });
				files.forEach((file) => unlinkSync(path.resolve(outputDir, file)));
			}
		},
	};
};

export default ViteSourceMapUploader;
