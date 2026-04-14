import type { BunPlugin } from "bun";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const shimPath = path.resolve(dirname, "../../shims/assert.ts");

export function browserAssertPlugin(): BunPlugin {
	return {
		name: "browser-assert-plugin",
		setup(build) {
			build.onResolve({ filter: /^(assert|node:assert|node:assert\/strict)$/ }, () => {
				return {
					path: shimPath,
					namespace: "file",
				};
			});
		},
	};
}
