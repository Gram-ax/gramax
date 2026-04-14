import type { BunPlugin } from "bun";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const shimPath = path.resolve(dirname, "../../shims/process.ts");

export function processStubPlugin(): BunPlugin {
	return {
		name: "process-stub",
		setup(build) {
			build.onResolve({ filter: /^(node:)?process$/ }, () => {
				return {
					path: shimPath,
					namespace: "file",
				};
			});
		},
	};
}
