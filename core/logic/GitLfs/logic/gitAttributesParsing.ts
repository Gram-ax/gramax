export type GitAttributeEntry = {
	pattern: string;
	attributes: string[];
	disabled: boolean;
};

export function parseGitAttributes(raw: string): GitAttributeEntry[] {
	return raw
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l)
		.map((l) => {
			const [pattern, ...attributes] = l.split(/\s+/);
			const disabled = pattern.startsWith("#");
			return {
				pattern: disabled ? pattern.slice(1).trim() : pattern,
				attributes,
				disabled,
			};
		});
}

export function serializeGitAttributes(entries: GitAttributeEntry[]): string {
	const lines = entries
		.filter((e) => e.disabled || e.attributes.length > 0)
		.map((e) => `${e.disabled ? "# " : ""}${e.pattern} ${e.attributes.join(" ")}`);

	// Trailing newline: what every other tool writes, and what keeps the last entry from being
	// glued to the next line when the file is diffed or appended to.
	return lines.length ? `${lines.join("\n")}\n` : "";
}

export function replaceLfsPatterns(entries: GitAttributeEntry[], newPatterns: string[]): GitAttributeEntry[] {
	const nonLfs = entries.filter((e) => !e.attributes.includes("filter=lfs"));
	const lfsEntries: GitAttributeEntry[] = newPatterns.map((pattern) => ({
		pattern,
		attributes: ["filter=lfs"],
		disabled: false,
	}));
	return [...nonLfs, ...lfsEntries];
}
