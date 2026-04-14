import type { BunPlugin } from "bun";
import * as Bun from "bun";
import path from "node:path";

export function reactSSRLayoutEffectPlugin(): BunPlugin {
	return {
		name: "react-ssr-layout-effect",
		setup(build) {
			build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async (args) => {
				if (args.path.includes(`${path.sep}node_modules${path.sep}`)) {
					return;
				}

				const file = Bun.file(args.path);
				let code = await file.text();

				if (!code.includes("useLayoutEffect") || !code.includes("react")) {
					return;
				}

				let changed = false;

				code = code.replace(/import\s*\{([^}]+)\}\s*from\s*["']react["'];?/g, (full, importsRaw) => {
					const imports = importsRaw
						.split(",")
						.map((s: string) => s.trim())
						.filter(Boolean);

					const hasULE = imports.some((i: string) => i === "useLayoutEffect");
					if (!hasULE) return full;

					const hasUE = imports.some((i: string) => i === "useEffect");

					const nextImports = [...imports];
					if (!hasUE) nextImports.push("useEffect");

					changed = true;
					return `import { ${nextImports.join(", ")} } from "react";`;
				});

				if (!changed) return;

				if (!code.includes("useIsomorphicLayoutEffect")) {
					const helper = `
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
`;
					const importMatches = [...code.matchAll(/^import .*$/gm)];
					if (importMatches.length > 0) {
						const last = importMatches[importMatches.length - 1];
						const idx = (last.index ?? 0) + last[0].length;
						code = `${code.slice(0, idx)}\n${helper}${code.slice(idx)}`;
					} else {
						code = `${helper}\n${code}`;
					}
				}

				code = code.replace(/\buseLayoutEffect\s*\(/g, "useIsomorphicLayoutEffect(");

				const ext = path.extname(args.path).toLowerCase();
				const loader = ext === ".tsx" ? "tsx" : ext === ".ts" ? "ts" : ext === ".jsx" ? "jsx" : "js";

				return {
					contents: code,
					loader,
				};
			});
		},
	};
}
