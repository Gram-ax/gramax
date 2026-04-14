import fs from "fs";
import path from "node:path";

export function fixBrokenChunkExports(dir: string) {
	const walk = (d: string): string[] => fs
		.readdirSync(d, { withFileTypes: true })
		.flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

	for (const file of walk(dir)) {
		if (!file.endsWith(".js")) continue;

		const src = fs.readFileSync(file, "utf8");

		const exportBlockRe = /export\s*\{[^}]*\}\s*;?/g;
		const codeWithoutExports = src.replace(exportBlockRe, "");

		const exportLocalNames: string[] = [];
		for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*;?/g)) {
			for (const part of m[1].split(",")) {
				const t = part.trim();
				if (!t) continue;
				const localName = t.includes(" as ") ? t.split(" as ")[0].trim() : t;
				exportLocalNames.push(localName);
			}
		}

		const allDeclaredNames = new Set<string>();

		for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from/g)) {
			for (const part of m[1].split(",")) {
				const t = part.trim();
				if (!t) continue;
				const localName = t.includes(" as ") ? t.split(" as ").pop()!.trim() : t;
				if (/^[\w$]+$/.test(localName)) allDeclaredNames.add(localName);
			}
		}
		for (const m of src.matchAll(/import\s+([\w$]+)\s+from/g)) {
			allDeclaredNames.add(m[1]);
		}

		for (const m of codeWithoutExports.matchAll(/(?:var|let|const)\s+([^;]+?)(?=\s*[;=])/g)) {
			for (const binding of m[0].replace(/^(?:var|let|const)\s+/, "").split(",")) {
				const name = binding.trim().split(/[=\s]/)[0];
				if (name && /^[\w$]+$/.test(name)) allDeclaredNames.add(name);
			}
		}
		for (const m of codeWithoutExports.matchAll(/(?:function|class)\s+([\w$]+)/g)) {
			allDeclaredNames.add(m[1]);
		}

		const broken = new Set<string>();
		for (const name of exportLocalNames) {
			if (!allDeclaredNames.has(name)) {
				broken.add(name);
			}
		}

		if (broken.size === 0) continue;

		const stubs = [...broken].map((n) => `var ${n}=void 0;`).join("");
		fs.writeFileSync(file, `${stubs}\n${src}`, "utf8");
	}
}
