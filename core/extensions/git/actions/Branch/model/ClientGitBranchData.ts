import GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";

interface ClientGitBranchData extends GitBranchData {
	branchHashSameAsHead: boolean;
}

export default ClientGitBranchData;
