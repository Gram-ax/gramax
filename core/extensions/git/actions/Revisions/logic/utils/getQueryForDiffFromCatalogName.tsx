import type Query from "@core/Api/Query";
import { GitTreeScopeParser } from "@ext/versioning/GitTreeScopeParser";

export const getQueryForDiffFromCatalogName = (
	catalogName: string,
	query: Query,
): { diff: true; scope: string; oldScope: string } | undefined => {
	if (query.diff !== "1") return;

	const difMatch = catalogName?.match(/dif-([a-f0-9]{40})-([a-f0-9]{40})/);
	if (difMatch) {
		return {
			diff: true,
			scope: GitTreeScopeParser.toString({ commit: difMatch[2] }),
			oldScope: GitTreeScopeParser.toString({ commit: difMatch[1] }),
		};
	}

	const commitMatch = catalogName?.match(/commit-([a-f0-9]+)/);
	if (commitMatch) {
		return {
			diff: true,
			scope: GitTreeScopeParser.toString({ commit: commitMatch[1] }),
			oldScope: query.oldScope ?? null,
		};
	}

	if (query.scope || query.oldScope) {
		return {
			diff: true,
			scope: (query.scope as string) ?? null,
			oldScope: (query.oldScope as string) ?? null,
		};
	}
};
