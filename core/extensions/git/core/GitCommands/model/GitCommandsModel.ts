import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import type { GitRevisionsFilter } from "@ext/git/actions/Revisions/model/GitRevisionsFilter";
import type {
	CommitAuthorInfo,
	ConfigValue,
	MergeResult,
	UpstreamCountFileChanges,
} from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import type GitStash from "@ext/git/core/model/GitStash";
import type GitVersionData from "@ext/git/core/model/GitVersionData";
import type { VersionControlInfo } from "@ext/VersionControl/model/VersionControlInfo";
import type { FileStatus } from "@ext/Watchers/model/FileStatus";
import type Path from "../../../../../logic/FileProvider/Path/Path";
import type SourceData from "../../../../storage/logic/SourceDataProvider/model/SourceData";
import type { GitBranch } from "../../GitBranch/GitBranch";
import type { GitStatus } from "../../GitWatcher/model/GitStatus";
import type GitSourceData from "../../model/GitSourceData.schema";
import type { GitVersion } from "../../model/GitVersion";

export type CancelToken = number;

export type GetCommitInfoOpts = {
	depth: number;
	simplify: boolean;
	filters?: GitRevisionsFilter;
	includeChangedFiles?: boolean;
};

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
	useMergeBase?: boolean;
	pathspecs?: string[];
};

export type DiffTree2TreeInfo = {
	hasChanges: boolean;
	added: number;
	deleted: number;
	mergeBase: GitVersion | null;
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
	isLfs: boolean;
	size: number;
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

type RemoteProgressTypes =
	| { type: "queue"; data: object }
	| { type: "started"; data: object }
	| { type: "finish"; data: { isCancelled: boolean } }
	| { type: "error"; data: { error: DefaultError } }
	| { type: "sideband"; data: { id: CancelToken; remoteText: string } }
	| { type: "checkout"; data: { id: CancelToken; checkouted: number; total: number } }
	| { type: "download"; data: { id: CancelToken; bytes: number; downloadSpeedBytes: number } }
	| { type: "download-no-progress"; data: object }
	| {
			type: "chunkedTransfer";
			data: { id: CancelToken; transfer: TransferProgress; bytes: number; downloadSpeedBytes: number };
	  }
	| {
			type: "lfs";
			data: {
				totalBytes: number;
				totalObjects: number;
				bytesHandled: number;
				objectsHandled: number;
				nextObjectSize: number;
				downloadSpeedBytes: number;
			};
	  };

export type RemoteProgress = RemoteProgressTypes & { cancellable?: boolean };

export type RemoteProgressPercentage = RemoteProgress & { percentage: number };

export type CommitScope = { commit: string };

export type RevisionScope = { oldCommit: CommitScope; newCommit: CommitScope };

export type TreeReadScope = CommitScope | RevisionScope | { reference: string } | "HEAD";

// `date` stays a plain epoch-ms number: these end up in catalog props, which next serializes into page
// props, and a Date instance there makes getServerSideProps throw.
export type RefInfo =
	| {
			kind: "tag";
			name: string;
			encodedName: string;
			oid: GitVersion;
			isLightweight: boolean;
			author?: string | null;
			date?: number;
	  }
	| { kind: "branch"; name: string; encodedName: string; date?: number };

export type DirEntry = {
	name: string;
	isDir: boolean;
};

export type FileStat = {
	size: number;
	isDir: boolean;
	isBinary: boolean;
};

export type ResetOptions = {
	mode: "soft" | "mixed" | "hard";
	head?: GitVersion;
};

export type DirStat = { name: string } & FileStat;

export type GcOptions = {
	looseObjectsLimit?: number;
	packFilesLimit?: number;
};

export type SizeStats = {
	count: number;
	size: number;
};

export type LooseObjectsStats = SizeStats & {
	unreachableCount: number;
	unreachableSize: number;
};

export type LfsObjectsStats = SizeStats & {
	prunableCount: number;
	prunableSize: number;
};

export type StorageStats = {
	packFiles: SizeStats;
	looseObjects: LooseObjectsStats;
	lfsObjects: LfsObjectsStats;
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
		allowNonEmptyDir?: boolean,
		skipLfsPull?: boolean,
		onProgress?: (progress: RemoteProgress) => void,
	): Promise<void>;
	recover(
		data: GitSourceData,
		cancelToken: CancelToken,
		onProgress: (progress: RemoteProgress) => void,
	): Promise<void>;
	cancel(id: number): Promise<boolean>;
	getAllCancelTokens(): Promise<number[]>;
	setHead(refname: string): Promise<void>;
	commit(message: string, data: SourceData, parents?: string[], files?: string[]): Promise<GitVersion>;
	add(paths?: Path[], force?: boolean): Promise<void>;
	status(type: "index" | "workdir"): Promise<GitStatus[]>;
	fileStatus(filePath: Path): Promise<GitStatus>;

	push(data: GitSourceData): Promise<void>;
	fetch(data: GitSourceData, force?: boolean, lock?: boolean): Promise<void>;
	checkout(data: GitSourceData, ref: string, force?: boolean): Promise<void>;
	merge(data: SourceData, opts: MergeOptions): Promise<MergeResult>;
	formatMergeMessage(data: SourceData, opts: MergeMessageFormatOptions): Promise<string>;
	hasMergeConflicts(branch: string, data: GitSourceData): Promise<string[]>;
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

	getFileHistory(filePath: Path, offset: number, limit: number): Promise<VersionControlInfo[]>;
	getCommitInfo(oid: string, opts: GetCommitInfoOpts): Promise<GitVersionData[]>;
	countChangedFiles(searchIn: string): Promise<UpstreamCountFileChanges>;

	getHeadCommit(branch: string): Promise<GitVersion>;

	pullLfsObjects(
		data: GitSourceData,
		paths: string[],
		checkout: boolean,
		cancelToken: CancelToken,
		scope?: TreeReadScope,
	): Promise<void>;

	reset(opts: ResetOptions): Promise<void>;

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
	lfsPrune(): Promise<void>;
	healthcheck(): Promise<void>;
	storageStats(): Promise<StorageStats>;

	getConfigVal(name: string): Promise<string>;
	setConfigVal(name: string, val: ConfigValue): Promise<void>;
}

export default GitCommandsModel;
