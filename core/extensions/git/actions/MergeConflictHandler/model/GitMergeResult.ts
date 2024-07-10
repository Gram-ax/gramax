import GitMergeStatus from "@ext/git/actions/MergeConflictHandler/model/GitMergeStatus";

interface GitMergeResult {
	status: GitMergeStatus;
	path: string;
}

export default GitMergeResult;
