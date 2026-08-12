export type LfsDivergence = { added: string[]; removed: string[] };

export default function computeLfsDivergence(
	workspacePatterns: string[] | undefined,
	currentPatterns: string[],
): LfsDivergence {
	if (!workspacePatterns?.length) return { added: [], removed: [] };

	const target = new Set(workspacePatterns);
	const current = new Set(currentPatterns);

	return {
		added: [...target].filter((p) => !current.has(p)),
		removed: [...current].filter((p) => !target.has(p)),
	};
}
