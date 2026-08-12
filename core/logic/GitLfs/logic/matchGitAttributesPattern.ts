// Subset of gitattributes pattern matching, enough for LFS masks (no negation, no `**`,
// no directory-only trailing-slash semantics). `**` is not special-cased — a literal `**`
// segment behaves like `*` repeated, i.e. still confined to a single path segment.
function globSegmentToRegExpSource(segment: string): string {
	let out = "";
	for (const char of segment) {
		if (char === "*") out += "[^/]*";
		else if (char === "?") out += "[^/]";
		else out += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}
	return out;
}

export default function matchGitAttributesPattern(pattern: string, relPath: string): boolean {
	const hasSlash = pattern.includes("/");
	const normalizedPattern = hasSlash ? pattern.replace(/^\//, "") : pattern;
	const subject = hasSlash ? relPath : (relPath.split("/").pop() ?? relPath);

	const source = `^${globSegmentToRegExpSource(normalizedPattern)}$`;
	return new RegExp(source).test(subject);
}
