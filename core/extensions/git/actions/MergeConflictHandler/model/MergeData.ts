import type { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import type MergeConflictCaller from "@ext/git/actions/MergeConflictHandler/model/MergeConflictCaller";

interface MergeData {
	ok: boolean;
	mergeFiles?: GitMergeResultContent[];
	reverseMerge?: boolean;
	caller?: MergeConflictCaller;
	stashRestored?: boolean;
}

export default MergeData;
