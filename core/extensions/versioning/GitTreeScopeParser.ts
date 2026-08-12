import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";

const COMMIT_HASH_LENGTH = 40;

export const GitTreeScopeParser = {
	parse(scope: string): TreeReadScope {
		if (!scope) return null;
		if (scope === "HEAD") return "HEAD";
		if (scope.startsWith("dif-")) {
			const rest = scope.slice(4);
			const match = rest.match(`^([a-f0-9]{${COMMIT_HASH_LENGTH}})-([a-f0-9]{${COMMIT_HASH_LENGTH}})$`);
			if (!match) {
				console.error("Invalid dif- scope string", scope);
				return null;
			}
			return { oldCommit: { commit: match[1] }, newCommit: { commit: match[2] } };
		}
		if (scope.startsWith("commit-")) return { commit: scope.slice(7) };
		if (scope.startsWith("reference-")) return { reference: scope.slice(10) };

		return { reference: scope };
	},
	toString(scope: TreeReadScope): string {
		if (!scope) return null;
		if (scope === "HEAD") return "HEAD";
		if ("oldCommit" in scope) return `dif-${scope.oldCommit.commit}-${scope.newCommit.commit}`;
		if ("commit" in scope) return `commit-${scope.commit}`;
		if ("reference" in scope) return scope.reference;
	},
};

/**
 * One representation of "read from a git tree other than HEAD": `undefined` means HEAD.
 * Diff scopes collapse to their new commit, mirroring GitTreeFileProvider.
 */
export const normalizeTreeScope = (scope?: TreeReadScope): TreeReadScope | undefined => {
	if (!scope || scope === "HEAD") return undefined;
	if ("oldCommit" in scope) return scope.newCommit;
	return scope;
};

export const treeScopeKey = (scope?: TreeReadScope): string => JSON.stringify(normalizeTreeScope(scope) ?? "HEAD");
