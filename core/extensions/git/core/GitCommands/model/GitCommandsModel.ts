import Path from "../../../../../logic/FileProvider/Path/Path";
import { VersionControlInfo } from "../../../../VersionControl/model/VersionControlInfo";
import SourceData from "../../../../storage/logic/SourceDataProvider/model/SourceData";
import { GitBranch } from "../../GitBranch/GitBranch";
import { GitStatus } from "../../GitWatcher/model/GitStatus";
import GitProgressEvent from "../../model/GitProgressEvent";
import GitSourceData from "../../model/GitSourceData.schema";
import { GitVersion } from "../../model/GitVersion";
import SubmoduleData from "../../model/SubmoduleData";

interface GitCommandsModel {
	init(data: SourceData): Promise<void>;
	clone(
		url: string,
		source: GitSourceData,
		branch?: string,
		onProgress?: (progress: GitProgressEvent) => void,
	): Promise<void>;
	commit(message: string, data: SourceData, parents?: string[]): Promise<GitVersion>;
	add(paths?: Path[]): Promise<void>;
	status(): Promise<GitStatus[]>;
	fileStatus(filePath: Path): Promise<GitStatus>;

	push(data: GitSourceData): Promise<void>;
	fetch(data: GitSourceData): Promise<void>;
	checkout(ref: string, force?: boolean): Promise<void>;
	merge(data: SourceData, theirs: string, abortOnConflict?: boolean): Promise<void>;
	restore(staged: boolean, filePaths: Path[]): Promise<void>;
	diff(oldTree: string, newTree: string): Promise<GitStatus[]>;

	stash(data: SourceData): Promise<string>;
	applyStash(data: SourceData, stashOid: string): Promise<void>;
	deleteStash(stashOid: string): Promise<void>;
	stashParent(stashOid: string): Promise<GitVersion>;

	getCurrentBranch(data: GitSourceData): Promise<GitBranch>;
	getCurrentBranchName(): Promise<string>;
	getAllBranches(): Promise<GitBranch[]>;
	getBranch(name: string): Promise<GitBranch>;
	deleteBranch(name: string, remote?: boolean, data?: GitSourceData): Promise<void>;
	newBranch(name: string): Promise<void>;
	getCommitHash(ref: string): Promise<GitVersion>;

	getFileHistory(filePath: Path, count: number): Promise<VersionControlInfo[]>;

	getHeadCommit(branch: string): Promise<GitVersion>;

	resetHard(): Promise<void>;
	resetSoft(head?: GitVersion): Promise<void>;

	addRemote(url: string): Promise<void>;
	getRemoteBranchName(name: string, data?: GitSourceData): Promise<string>;
	getRemoteName(): Promise<string>;
	getRemoteUrl(): Promise<string>;

	getRemoteUrl(): Promise<string>;
	showFileContent(filePath: Path, hash?: GitVersion): Promise<string>;
	getParentCommit(commitOid: string): Promise<string>;
	getFixedSubmodulePaths(): Promise<Path[]>;
	getSubmodulesData(): Promise<SubmoduleData[]>;
}

export default GitCommandsModel;
