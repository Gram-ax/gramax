// CLI program

import { readDirToFileTree } from "@web/utils";
import { parseArgs } from "util";

const { positionals: args } = parseArgs({
	args: Bun.argv.slice(2),
	allowPositionals: true,
});

const [dirPath] = args;

if (!dirPath) {
	console.error("Error: Expected exactly one argument - path to directory");
	process.exit(1);
}

const convertToReadable = (obj: unknown, indent = 0): string => {
	const spaces = "  ".repeat(indent);
	const innerSpaces = "  ".repeat(indent + 1);

	if (typeof obj !== "object" || obj === null) {
		if (typeof obj === "string") {
			return `\`${obj}\``;
		}
		return JSON.stringify(obj);
	}

	if (Array.isArray(obj)) {
		if (obj.length === 0) return "[]";
		const items = obj.map((item) => `${innerSpaces}${convertToReadable(item, indent + 1)}`).join(",\n");
		return `[\n${items}\n${spaces}]`;
	}

	const entries = Object.entries(obj);
	if (entries.length === 0) return "{}";

	let result = "{\n";
	entries.forEach(([key, value], index) => {
		const isLast = index === entries.length - 1;
		const formattedValue = convertToReadable(value, indent + 1);
		result += `${innerSpaces}"${key}": ${formattedValue}${isLast ? "" : ","}\n`;
	});
	result += `${spaces}}`;

	return result;
};

try {
	const result = await readDirToFileTree(dirPath);
	console.log(convertToReadable(result));
} catch (error) {
	console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
	process.exit(1);
}
