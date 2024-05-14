import BranchData from "../../../../VersionControl/model/branch/BranchData";

export default interface GitBranchData extends BranchData {
	lastCommitModify: string;
	lastCommitAuthor: string;
	remoteName?: string;
	lastCommitOid: string;
}
