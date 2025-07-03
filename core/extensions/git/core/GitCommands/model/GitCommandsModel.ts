import type { FileStatus } from "@ext/Watchers/model/FileStatus";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import type {
	CommitAuthorInfo,
	MergeResult,
	UpstreamCountFileChanges,
} from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import GitStash from "@ext/git/core/model/GitStash";
import GitVersionData from "@ext/git/core/model/GitVersionData";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { VersionControlInfo } from "../../../../VersionControl/model/VersionControlInfo";
import SourceData from "../../../../storage/logic/SourceDataProvider/model/SourceData";
import { GitBranch } from "../../GitBranch/GitBranch";
import { GitStatus } from "../../GitWatcher/model/GitStatus";
import GitSourceData from "../../model/GitSourceData.schema";
import { GitVersion } from "../../model/GitVersion";

export type CloneCancelToken = number;

export type DiffCompareOptions =
	| {
			type: "tree";
			new: GitVersion | string;
			old: GitVersion | string;
	  }
	| {
			type: "workdir" | "index";
			tree?: GitVersion | string;
	  };

export type DiffConfig = {
	compare: DiffCompareOptions;
	renames: boolean;
};

export type DiffTree2TreeInfo = {
	hasChanges: boolean;
	added: number;
	deleted: number;
	files: DiffTree2TreeFile[];
};

export type MergeMessageFormatOptions = {
	theirs: string;
	squash?: boolean;
	maxCommits?: number;
	isMergeRequest?: boolean;
};

export type DiffTree2TreeFile = {
	path: Path;
	oldPath: Path;
	status: FileStatus;
	added: number;
	deleted: number;
};

export type MergeOptions = {
	theirs: string;
	deleteAfterMerge?: boolean;
	squash?: boolean;
	isMergeRequest?: boolean;
};

export type TransferProgress =
	| { type: "indexingDeltas"; data: { indexed: number; total: number } }
	| { type: "receivingObjects"; data: { received: number; indexed: number; total: number } };

type CloneProgressTypes =
	| { type: "queue"; data: object }
	| { type: "started"; data: object }
	| { type: "finish"; data: { isCancelled: boolean } }
	| { type: "error"; data: { error: DefaultError } }
	| { type: "sideband"; data: { id: CloneCancelToken; remoteText: string } }
	| { type: "checkout"; data: { id: CloneCancelToken; checkouted: number; total: number } }
	| { type: "download"; data: { id: CloneCancelToken; bytes: number; downloadSpeedBytes: number } }
	| {
			type: "chunkedTransfer";
			data: { id: CloneCancelToken; transfer: TransferProgress; bytes: number; downloadSpeedBytes: number };
	  };

export type CloneProgress = CloneProgressTypes & { cancellable?: boolean };

export type CommitScope = { commit: string };

export type TreeReadScope = CommitScope | { reference: string } | "HEAD";

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

export type GcOptions = {
	looseObjectsLimit?: number;
	packFilesLimit?: number;
};

interface GitCommandsModel {
	isInit(): Promise<boolean>;
	isBare(): Promise<boolean>;
	init(data: SourceData): Promise<void>;
	clone(
		url: string,
		source: GitSourceData,
		cancelToken: number,
		branch?: string,
		depth?: number,
		isBare?: boolean,
		onProgress?: (progress: CloneProgress) => void,
	): Promise<void>;
	cloneCancel(id: number): Promise<boolean>;
	getAllCancelTokens(): Promise<number[]>;
	setHead(refname: string): Promise<void>;
	commit(message: string, data: SourceData, parents?: string[], files?: string[]): Promise<GitVersion>;
	add(paths?: Path[], force?: boolean): Promise<void>;
	status(type: "index" | "workdir"): Promise<GitStatus[]>;
	fileStatus(filePath: Path): Promise<GitStatus>;

	push(data: GitSourceData): Promise<void>;
	fetch(data: GitSourceData, force?: boolean): Promise<void>;
	checkout(ref: string, force?: boolean): Promise<void>;
	merge(data: SourceData, opts: MergeOptions): Promise<MergeResult>;
	formatMergeMessage(data: SourceData, opts: MergeMessageFormatOptions): Promise<string>;
	restore(staged: boolean, filePaths: Path[]): Promise<void>;
	diff(opts: DiffConfig): Promise<DiffTree2TreeInfo>;

	stash(data: SourceData): Promise<string>;
	applyStash(stashOid: string): Promise<MergeResult>;
	deleteStash(stashOid: string): Promise<void>;
	stashParent(stashOid: string): Promise<GitVersion>;

	getDefaultBranch(source: SourceData): Promise<GitBranch | null>;
	getCurrentBranch(data: GitSourceData): Promise<GitBranch>;
	getCurrentBranchName(): Promise<string>;
	getAllBranches(): Promise<GitBranch[]>;
	getBranch(name: string): Promise<GitBranch>;
	deleteBranch(name: string, remote?: boolean, data?: GitSourceData): Promise<void>;
	newBranch(name: string): Promise<void>;
	getCommitHash(ref: string): Promise<GitVersion>;

	getFileHistory(filePath: Path, count: number): Promise<VersionControlInfo[]>;
	getCommitInfo(oid: string, opts: { depth: number; simplify: boolean }): Promise<GitVersionData[]>;
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
	getCommitAuthors(): Promise<CommitAuthorInfo[]>;

	readFile(filePath: Path, scope: TreeReadScope): Promise<ArrayBuffer>;
	readDir(dirPath: Path, scope: TreeReadScope): Promise<DirEntry[]>;
	readDirStats(dirPath: Path, scope: TreeReadScope): Promise<DirStat[]>;
	fileStat(filePath: Path, scope: TreeReadScope): Promise<FileStat>;
	fileExists(filePath: Path, scope: TreeReadScope): Promise<boolean>;

	gc(opts: GcOptions): Promise<void>;
}

export default GitCommandsModel;
