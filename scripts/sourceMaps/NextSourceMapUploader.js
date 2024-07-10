"use strict";

const { browser } = require("@bugsnag/source-maps");
const parallel = require("run-parallel-limit");
const extname = require("path").extname;
const join = require("path").join;
const webpackVersion = require("webpack").version;

const LOG_PREFIX = "[NextSourceMapUploader]";
const PUBLIC_PATH_WARN =
	"`publicPath` is not set.\n\n" +
	"  Source maps must be uploaded with the pattern that matches the file path in stacktraces.\n\n" +
	'  To make this message go away, set "publicPath" in Webpack config ("output" section)\n' +
	'  or set "publicPath" in NextSourceMapUploader constructor.\n\n' +
	"  In some cases, such as in a Node environment, it is safe to ignore this message.\n";

const stripQuery = (file) => {
	const queryStringIdx = file.indexOf("?");
	if (queryStringIdx < 0) return file;
	return file.substr(0, queryStringIdx);
};

class NextSourceMapUploader {
	constructor(options) {
		this.apiKey = options.apiKey;
		this.publicPath = options.publicPath;
		this.appVersion = options.appVersion;
		this.codeBundleId = options.codeBundleId;
		this.overwrite = options.overwrite;
		this.endpoint = options.endpoint;
		this.ignoredBundleExtensions = options.ignoredBundleExtensions || [".css"];
		this.validate();
	}

	validate() {
		if (typeof this.apiKey !== "string" || this.apiKey.length < 1) {
			throw new Error(`${LOG_PREFIX} "apiKey" is required`);
		}
	}

	apply(compiler) {
		const webpackMajorVersion = parseInt((webpackVersion || "0.0.0").split(".")[0], 10);

		const plugin = (compilation, cb) => {
			const compiler = compilation.compiler;
			const stats = compilation.getStats().toJson();
			const publicPath = this.publicPath || stats.publicPath || "";
			const outputPath = compilation.getPath(compiler.outputPath);
			const logger = compiler.getInfrastructureLogger
				? compiler.getInfrastructureLogger("NextSourceMapUploader")
				: console;
			const logPrefix = compiler.getInfrastructureLogger ? "" : `${LOG_PREFIX} `;

			const chunkToSourceMapDescriptors = (chunk) => {
				const maps = chunk[webpackMajorVersion >= 5 ? "auxiliaryFiles" : "files"].filter((file) =>
					/.+\.map(\?.*)?$/.test(file),
				);

				if (!publicPath) {
					logger.warn(`${logPrefix}${PUBLIC_PATH_WARN}`);
				}

				return maps
					.map((map) => {
						const source = chunk.files.find((file) => map.replace(".map", "").endsWith(file));

						if (!source) {
							logger.warn(
								`${logPrefix}no corresponding source found for "${map}" in chunk "${chunk.id}"`,
							);
							return null;
						}

						if (!compilation.assets[source]) {
							logger.debug(`${logPrefix}source asset not found in compilation output "${source}"`);
							return null;
						}

						if (!compilation.assets[map]) {
							logger.debug(`${logPrefix}source map not found in compilation output "${map}"`);
							return null;
						}

						const outputChunkLocation = stripQuery(join(outputPath, source));
						const outputSourceMapLocation = stripQuery(join(outputPath, map));
						if (this.ignoredBundleExtensions.indexOf(extname(outputChunkLocation)) !== -1) return null;

						const url = outputChunkLocation.includes("server")
							? outputChunkLocation.slice(outputChunkLocation.indexOf(".next"))
							: "" + publicPath.replace(/[^/]$/, "$&/") + source.replace(/^\.?\//, "");

						return {
							source: outputChunkLocation,
							map: outputSourceMapLocation,
							url,
						};
					})
					.filter(Boolean);
			};

			const sourceMaps = stats.chunks
				.map(chunkToSourceMapDescriptors)
				.reduce((accum, ds) => accum.concat(ds), []);

			parallel(
				sourceMaps.map((sm) => (cb) => {
					logger.info(`${logPrefix}uploading sourcemap for "${sm.url}"`);
					browser.uploadOne(this.getUploadOpts(sm)).then(cb, cb);
				}),
				10,
				cb,
			);
		};

		if (compiler.hooks) {
			// webpack v4
			compiler.hooks.afterEmit.tapAsync("NextSourceMapUploader", plugin);
		} else {
			// webpack v3
			compiler.plugin("after-emit", plugin);
		}
	}

	getUploadOpts(sm) {
		const opts = {
			apiKey: this.apiKey,
			appVersion: this.appVersion,
			codeBundleId: this.codeBundleId,
			bundleUrl: sm.url,
			bundle: sm.source,
			sourceMap: sm.map,
		};
		if (this.endpoint) opts.endpoint = this.endpoint;
		if (this.overwrite) opts.overwrite = this.overwrite;
		return opts;
	}
}

module.exports = NextSourceMapUploader;
