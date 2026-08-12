import type { BunPlugin } from "bun";
import path from "path";

const replaceImportPlugin = (dirname: string): BunPlugin => {
	return {
		name: "replace-import",
		setup(build) {
			const rustCallIndex = path.resolve(dirname, "../../../app/resolveModule/rustcall/index.ts");
			const docportalRustCall = path.resolve(dirname, "../../../app/resolveModule/rustcall/docportal.ts");

			build.onResolve({ filter: /^@app\/resolveModule\/backend$/ }, (_) => {
				return {
					path: path.resolve(dirname, "../../../app/resolveModule/backend/docportal.ts"),
					namespace: "file",
				};
			});
			build.onResolve({ filter: /^@app\/resolveModule\/frontend$/ }, (_) => {
				return {
					path: path.resolve(dirname, "../../../app/resolveModule/frontend/docportal.ts"),
					namespace: "file",
				};
			});
			build.onResolve({ filter: /^\.\/next$/ }, (args) => {
				if (args.importer === rustCallIndex) return { path: docportalRustCall, namespace: "file" };
			});
		},
	};
};

export default replaceImportPlugin;
