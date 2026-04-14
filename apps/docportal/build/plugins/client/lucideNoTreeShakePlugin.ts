import type { BunPlugin } from "bun";
import fs from "fs";
import path from "node:path";

export function lucideNoTreeShakePlugin(dirname: string): BunPlugin {
	return {
		name: "lucide-no-tree-shake",
		setup(build) {
			build.onResolve({ filter: /^lucide-react$/ }, (args) => {
				if (args.namespace === "lucide-all") return undefined;
				return {
					path: "lucide-react",
					namespace: "lucide-all",
				};
			});

			build.onLoad({ filter: /.*/, namespace: "lucide-all" }, () => {
				const mainPath = path.resolve(dirname, "../../../node_modules/lucide-react/dist/esm/lucide-react.js");
				const src = fs.readFileSync(mainPath, "utf8");

				const fileToNames = new Map<string, string[]>();

				for (const m of src.matchAll(/export\s*\{([^}]+)\}\s*from\s*'([^']+)'/g)) {
					const specifiers = m[1];
					const fromPath = m[2];
					const resolvedFrom = `lucide-react/dist/esm/${fromPath.replace("./", "")}`;

					for (const part of specifiers.split(",")) {
						const t = part.trim();
						if (!t) continue;
						const asMatch = t.match(/default\s+as\s+(\w+)/);
						if (asMatch) {
							if (!fileToNames.has(resolvedFrom)) fileToNames.set(resolvedFrom, []);
							fileToNames.get(resolvedFrom)!.push(asMatch[1]);
						}
					}
				}

				const importLines: string[] = [];
				const objEntries: string[] = [];
				let idx = 0;

				for (const [file, names] of fileToNames) {
					const alias = `_i${idx++}`;
					importLines.push(`import { default as ${alias} } from "${file}";`);
					for (const name of names) {
						objEntries.push(`${name}: ${alias}`);
					}
				}

				const namedExports = objEntries
					.map((entry) => {
						const name = entry.split(":")[0].trim();
						return `export var ${name} = _allIcons["${name}"];`;
					})
					.join("\n");

				const contents = `${importLines.join("\n")}
var _allIcons = {\n  ${objEntries.join(",\n  ")}\n};
${namedExports}
export default _allIcons;
`;
				return { contents, loader: "js" };
			});
		},
	};
}
