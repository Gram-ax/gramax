import { CommitScope, TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";

const convertScopeToCommitScope = async (
	scope: TreeReadScope,
	gvc: GitVersionControl,
	branchPriority: "local" | "remote" = "remote",
): Promise<CommitScope> => {
	if (!scope) return null;
	if (scope === "HEAD") {
		const headOid = (await gvc.getHeadCommit()).toString();
		return { commit: headOid };
	}
	if ("commit" in scope) return scope;
	if ("reference" in scope) {
		if (branchPriority === "remote") {
			const allBranches = await gvc.getAllBranches();
			const branch = allBranches.find(
				(b) => b.getData().name === scope.reference || b.getData().remoteName === scope.reference,
			);

			if (branch) return { commit: branch.getData().lastCommitOid };
		}

		const oid = (await gvc.getHeadCommit(scope.reference)).toString();
		return { commit: oid };
	}
};

export default convertScopeToCommitScope;
