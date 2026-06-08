export type CompactSearchResult = {
	hits: Array<{ itemPath: string; title: string; snippets: string[] }>;
	truncated: boolean;
	totalMatched: number;
};

function flattenTitleParts(parts: unknown): string {
	if (!Array.isArray(parts)) return "";
	return parts
		.map((p) => (p && typeof p === "object" && "text" in p ? String((p as { text?: string }).text ?? "") : ""))
		.join("")
		.trim();
}

function collectScoredSnippets(node: unknown, acc: { score: number; text: string }[]): void {
	if (!node || typeof node !== "object") return;
	const stack: unknown[] = [node];
	while (stack.length) {
		const cur = stack.pop();
		if (!cur || typeof cur !== "object") continue;
		const o = cur as { items?: unknown[]; searchText?: unknown; score?: unknown };
		if (typeof o.searchText === "string") {
			const score = typeof o.score === "number" ? o.score : 0;
			acc.push({ score, text: o.searchText });
		}
		if (Array.isArray(o.items)) stack.push(...o.items);
	}
}

function trimSnippet(text: string, maxChars: number): string {
	const normalized = text.replace(/\s+/g, " ").trim();
	if (normalized.length <= maxChars) return normalized;
	return `${normalized.slice(0, maxChars - 1)}...`;
}

function refPathToItemPath(refPath: string, catalogName: string | undefined): string {
	const firstPart = refPath.split("/")[0]?.trim();
	const catalog = catalogName?.trim() || firstPart;
	if (!catalog) return refPath;
	const prefix = `${catalog}/`;
	return refPath.startsWith(prefix) ? refPath.slice(prefix.length) : refPath;
}

function hitTitle(hit: Record<string, unknown>): string {
	if (typeof hit.title === "string") return hit.title.trim();
	return flattenTitleParts(hit.title);
}

export function compactSearchResults(
	raw: unknown,
	catalogName: string | undefined,
	hitsLimit: number,
	snippetsPerHit: number,
	snippetMaxChars: number,
): CompactSearchResult {
	if (!Array.isArray(raw)) return { hits: [], truncated: false, totalMatched: 0 };
	const totalMatched = raw.length;
	const enriched = raw
		.filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
		.map((hit) => {
			const refPath = typeof hit.refPath === "string" ? hit.refPath : "";
			const snippetsWithScore: { score: number; text: string }[] = [];
			collectScoredSnippets(hit, snippetsWithScore);
			snippetsWithScore.sort((a, b) => b.score - a.score);
			const snippets = snippetsWithScore
				.slice(0, snippetsPerHit)
				.map((snippet) => trimSnippet(snippet.text, snippetMaxChars))
				.filter(Boolean);
			const score = snippetsWithScore.length ? snippetsWithScore[0]!.score : 0;
			return {
				itemPath: refPath ? refPathToItemPath(refPath, catalogName) : "",
				title: hitTitle(hit),
				snippets,
				score,
			};
		})
		.filter((hit) => hit.itemPath)
		.sort((a, b) => b.score - a.score);

	const hits = enriched.slice(0, hitsLimit).map(({ score: _score, ...publicHit }) => publicHit);
	return { hits, truncated: totalMatched > hits.length, totalMatched };
}
