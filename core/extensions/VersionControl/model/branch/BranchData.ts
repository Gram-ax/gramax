import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";

export default interface BranchData {
	name: string;
	mergeRequest?: MergeRequest;
}
