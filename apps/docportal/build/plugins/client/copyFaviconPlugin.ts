import type { BunPlugin } from "bun";
import fs from "fs";
import path from "path";

export function copyFaviconPlugin(dirname: string): BunPlugin {
	return {
		name: "copy-public-plugin",
		setup(build) {
			build.onEnd(() => {
				const faviconDir = path.resolve(dirname, "../../../core/public/favicon.ico");
				const distFaviconDir = path.resolve(dirname, "../dist/assets/favicon.ico");
				fs.copyFileSync(faviconDir, distFaviconDir);
			});
		},
	};
}
