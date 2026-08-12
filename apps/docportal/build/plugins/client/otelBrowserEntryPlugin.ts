import type { BunPlugin } from "bun";
import path from "path";

/**
 * Binds the OTel entry point to its browser implementation — the same swap
 * `scripts/compileTimeEnv.mjs` (`dynamicModules`) does for the vite builds.
 *
 * The entry point picks an implementation at runtime, so bundling it whole also pulls in the
 * Node-only `next` one, which imports `async_hooks` and fails a `target: "browser"` build.
 * Client-only: the server build keeps the runtime pick.
 */
export function otelBrowserEntryPlugin(dirname: string): BunPlugin {
	return {
		name: "otel-browser-entry",
		setup(build) {
			build.onResolve({ filter: /^@ext\/loggers\/opentelemetry\/registerOtel$/ }, (_) => {
				return {
					path: path.resolve(dirname, "../../../core/extensions/loggers/opentelemetry/web/registerOtel.ts"),
					namespace: "file",
				};
			});
		},
	};
}
