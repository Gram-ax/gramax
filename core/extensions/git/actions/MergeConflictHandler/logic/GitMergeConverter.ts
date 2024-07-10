import GitMergeResult from "@ext/git/actions/MergeConflictHandler/model/GitMergeResult";
import GitMergeStatus from "@ext/git/actions/MergeConflictHandler/model/GitMergeStatus";
import { MergeResult } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";

const gitMergeConverter = (mergeResult: MergeResult): GitMergeResult[] => {
	return mergeResult.map((r) => {
		if (r.ancestor && r.ours && r.theirs) return { status: GitMergeStatus.BothModified, path: r.ours };
		if (r.ancestor && !r.ours && r.theirs) return { status: GitMergeStatus.DeletedByUs, path: r.theirs };
		if (r.ancestor && r.ours && !r.theirs) return { status: GitMergeStatus.DeletedByThem, path: r.ours };
		if (r.ancestor && !r.ours && !r.theirs) return { status: GitMergeStatus.BothDeleted, path: r.ancestor };

		if (!r.ancestor && r.ours && r.theirs) return { status: GitMergeStatus.BothAdded, path: r.ours };
		if (!r.ancestor && !r.ours && r.theirs) return { status: GitMergeStatus.AddedByThem, path: r.theirs };
		if (!r.ancestor && r.ours && !r.theirs) return { status: GitMergeStatus.AddedByUs, path: r.ours };
	});
};

export default gitMergeConverter;
