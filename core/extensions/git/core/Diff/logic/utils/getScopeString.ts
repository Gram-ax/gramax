import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";

const getScopeString = (scope: TreeReadScope): string | null => {
	if (!scope) return null;
	if (scope === "HEAD") return "HEAD";
	if ("commit" in scope) return `commit-${scope.commit}`;
	if ("reference" in scope) return scope.reference;
	return null;
};

export default getScopeString;
