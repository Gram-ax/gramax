import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import type { MergeResult, UpstreamCountFileChanges } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import GitStash from "@ext/git/core/model/GitStash";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { VersionControlInfo } from "../../../../VersionControl/model/VersionControlInfo";
import SourceData from "../../../../storage/logic/SourceDataProvider/model/SourceData";
import { GitBranch } from "../../GitBranch/GitBranch";
import { GitStatus } from "../../GitWatcher/model/GitStatus";
import GitSourceData from "../../model/GitSourceData.schema";
import { GitVersion } from "../../model/GitVersion";

export type TransferProgress =
	| { type: "indexingDeltas"; data: { indexed: number; total: number } }
	| { type: "receivingObjects"; data: { received: number; indexed: number; total: number } };

export type TreeReadScope = { commit: string } | { reference: string } | null;

export type RefInfo =
	| {
			kind: "tag";
			name: string;
			encodedName: string;
			oid: GitVersion;
			isLightweight: boolean;
			author?: string | null;
			date?: Date;
	  }
	| { kind: "branch"; name: string; encodedName: string; date?: Date };

export type DirEntry = {
	name: string;
	isDir: boolean;
};

export type FileStat = {
	size: number;
	isDir: boolean;
	isBinary: boolean;
};

export type DirStat = { name: string } & FileStat;

export type CloneProgress =
	| { type: "wait"; data: { path: string } }
	| { type: "started"; data: { path: string } }
	| { type: "finish"; data: { path: string } }
	| { type: "error"; data: { path: string; error: DefaultError } }
	| { type: "sideband"; data: { remote_text: string } }
	| { type: "chunkedTransfer"; data: { transfer: TransferProgress; bytes: number; download_speed_bytes: number } };
interface GitCommandsModel {
	isInit(): Promise<boolean>;
	isBare(): Promise<boolean>;
	init(data: SourceData): Promise<void>;
	clone(
		url: string,
		source: GitSourceData,
		branch?: string,
		depth?: number,
		isBare?: boolean,
		onProgress?: (progress: CloneProgress) => void,
	): Promise<void>;
	setHead(refname: string): Promise<void>;
	commit(message: string, data: SourceData, parents?: string[]): Promise<GitVersion>;
	add(paths?: Path[]): Promise<void>;
	status(): Promise<GitStatus[]>;
	fileStatus(filePath: Path): Promise<GitStatus>;

	push(data: GitSourceData): Promise<void>;
	fetch(data: GitSourceData, force?: boolean): Promise<void>;
	checkout(ref: string, force?: boolean): Promise<void>;
	merge(data: SourceData, theirs: string): Promise<MergeResult>;
	restore(staged: boolean, filePaths: Path[]): Promise<void>;
	diff(oldTree: string, newTree: string): Promise<GitStatus[]>;

	stash(data: SourceData): Promise<string>;
	applyStash(stashOid: string): Promise<MergeResult>;
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
	graphHeadUpstreamFilesCount(searchIn: string): Promise<UpstreamCountFileChanges>;

	getHeadCommit(branch: string): Promise<GitVersion>;

	resetHard(head?: GitVersion): Promise<void>;
	resetSoft(head?: GitVersion): Promise<void>;

	addRemote(url: string): Promise<void>;
	getRemoteBranchName(name: string, data?: GitSourceData): Promise<string>;
	getRemoteName(): Promise<string>;
	getRemoteUrl(): Promise<string>;
	hasRemote(): Promise<boolean>;
	showFileContent(filePath: Path, ref?: GitVersion | GitStash): Promise<string>;
	getParentCommit(commitOid: string): Promise<string>;
	getReferencesByGlob(patterns: string[]): Promise<RefInfo[]>;

	readFile(filePath: Path, scope: TreeReadScope): Promise<ArrayBuffer>;
	readDir(dirPath: Path, scope: TreeReadScope): Promise<DirEntry[]>;
	readDirStats(dirPath: Path, scope: TreeReadScope): Promise<DirStat[]>;
	fileStat(filePath: Path, scope: TreeReadScope): Promise<FileStat>;
	fileExists(filePath: Path, scope: TreeReadScope): Promise<boolean>;
}

export default GitCommandsModel;
