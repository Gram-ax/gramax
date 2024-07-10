import { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import MergeConflictCaller from "@ext/git/actions/MergeConflictHandler/model/MergeConflictCaller";

interface MergeData {
	ok: boolean;
	mergeFiles?: GitMergeResultContent[];
	reverseMerge?: boolean;
	caller?: MergeConflictCaller;
}

export default MergeData;
