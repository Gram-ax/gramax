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
				// onEnd fires even when the build failed and outdir was never created; without this
				// the copy throws ENOENT and masks the real build error.
				fs.mkdirSync(path.dirname(distFaviconDir), { recursive: true });
				fs.copyFileSync(faviconDir, distFaviconDir);
			});
		},
	};
}
