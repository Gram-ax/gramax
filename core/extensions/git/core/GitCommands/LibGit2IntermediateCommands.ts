/** biome-ignore-all lint/suspicious/noExplicitAny: expected */
import { getExecutingEnvironment } from "@app/resolveModule/env";
import rustCall from "@app/resolveModule/rustcall";
import AuthorInfoCodec from "@core-ui/utils/authorInfoCodec";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import type {
	DiffConfig,
	DiffTree2TreeInfo,
	DirEntry,
	DirStat,
	FileStat,
	GcOptions,
	GetCommitInfoOpts,
	MergeMessageFormatOptions,
	MergeOptions,
	RemoteProgress,
	StorageStats,
	TreeReadScope,
} from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type { CreateMergeRequest, MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import type { Signature } from "@ext/git/core/model/Signature";
import type { VersionControlInfo } from "@ext/VersionControl/model/VersionControlInfo";

export const progress = {};

type Oid = string;

export type TagInfo = {
	name: string;
	oid: string;
	author: string;
	date: number;
};

export type Args = {
	repoPath: string;
};

export type Creds = {
	authorName: string;
	authorEmail: string;
	accessToken: string;
	gitServerUsername?: string;
	protocol?: string;
};

export type RefInfo =
	| { kind: "tag"; name: string; oid: string; isLightweight: boolean; author?: string | null; date?: number }
	| { kind: "branch"; name: string; date?: number };

export type CommitAuthorInfo = Signature & {
	count: number;
};

export type RawCommitInfo = {
	author: Signature;
	timestamp: number;
	oid: string;
	summary: string;
	parents: string[];
	stat: {
		added: number;
		deleted: number;
		changedFiles?: { path: string; title?: string }[];
	};
};

export type CredsArgs = Args & { creds: Creds };

export type UpstreamCountFileChanges = {
	pull: number;
	push: number;
	changed: number;
	hasChanges: boolean;
};

export type MergeConflictInfo = {
	ours?: string;
	theirs?: string;
	ancestor?: string;
};

export type MergeResult = MergeConflictInfo[];

export type CommitOptions = {
	message: string;
	parentRefs?: string[];
	files?: string[];
};

export type ResetOptions = {
	mode: "soft" | "mixed" | "hard";
	head?: string;
};

export type RemoteOptions = {
	cancelToken: number;
	force: boolean;
};

export type ConfigValue = {
	kind: "str" | "i32" | "i64" | "bool";
	val: string | number | boolean;
};

export const clone = async (
	args: {
		creds: Creds;
		opts: {
			url: string;
			to: string;
			cancelToken: number;
			branch?: string;
			depth?: number;
			allowNonEmptyDir?: boolean;
			isBare?: boolean;
			skipLfsPull?: boolean;
		};
	},
	onProgress?: (progress: RemoteProgress) => void,
) => {
	progress[args.opts.cancelToken] = onProgress;
	try {
		await rustCall<any>("git.clone", args);
	} finally {
		delete progress[args.opts.cancelToken];
	}
};

export const recover = async (
	args: Args & { creds: Creds; cancelToken: number },
	onProgress: (progress: RemoteProgress) => void,
) => {
	progress[args.cancelToken] = onProgress;

	try {
		await rustCall<void>("git.recover", args);
	} finally {
		delete progress[args.cancelToken];
	}
};

export const cancel = (id: number) => rustCall<boolean>("git.cancel", { id });

export const getAllCancelTokens = () => rustCall<number[]>("git.get_all_cancel_tokens", {});

export const init = (args: CredsArgs) => rustCall<Oid>("git.init_new", args);

export const fileHistory = async (args: Args & { filePath: string; offset: number; limit: number }) => {
	const infos = await rustCall<any[]>("git.file_history", args);
	return infos.map(
		(i): VersionControlInfo => ({
			version: i.commitOid as string,
			author: i.authorName as string,
			date: new Date(i.date).toISOString(),
			filePath: {
				path: i.path as string,
				oldPath: i.parentPath as string | undefined,
				diff: i.diff,
			},
		}),
	);
};

export const listMergeRequests = async (args: Args): Promise<MergeRequest[]> => {
	const mrs = await rustCall<any[]>("git.list_merge_requests", args);
	return mrs.map(intoMergeRequest);
};

export const createOrUpdateMergeRequest = async (args: CredsArgs & { mergeRequest: CreateMergeRequest }) => {
	if (args.mergeRequest.createdAt) (args.mergeRequest.createdAt as any) = formatTime(args.mergeRequest.createdAt);

	if (args.mergeRequest.approvers) {
		args.mergeRequest.approvers = args.mergeRequest.approvers.map((approver) => ({
			user: `${approver.name} <${approver.email}>`,
			approvedAt: formatTime(approver.approvedAt),
		})) as any;
	}

	if (getExecutingEnvironment() === "next") args.mergeRequest = JSON.stringify(args.mergeRequest) as any;

	await rustCall<void>("git.create_or_update_merge_request", args);
};

export const getDraftMergeRequest = async (args: Args) => {
	const data = await rustCall<MergeRequest | undefined>("git.get_draft_merge_request", args);
	return data ? intoMergeRequest(data) : undefined;
};

export const status = (args: Args & { index: boolean }) =>
	rustCall<[{ path: string; status: string }]>("git.status", args);

export const statusFile = (args: Args & { filePath: string }) => rustCall<string>("git.status_file", args);

export const fetch = (args: CredsArgs & { opts: RemoteOptions; lock: boolean }) => rustCall<void>("git.fetch", args);

export const merge = (args: CredsArgs & { opts: MergeOptions }) => {
	args.opts = intoMergeOptions(args.opts);
	return rustCall<MergeResult>("git.merge", args);
};

export const push = (args: CredsArgs) => rustCall<void>("git.push", args);

export const add = (args: Args & { patterns: string[]; force: boolean }) => rustCall<void>("git.add", args);

export const diff = (args: Args & { opts: DiffConfig }) => rustCall<DiffTree2TreeInfo>("git.diff", args);

export const branchInfo = async (
	args: Args & { name: string | null },
): Promise<GitBranchData & { lastCommitOid: string }> => {
	if (args.name === "HEAD") args.name = null;
	const data = await rustCall<any>("git.branch_info", args);
	return intoGitBranchData(data);
};

export const getAllBranches = (args: Args) =>
	rustCall<GitBranchData[]>("git.branch_list", args).then((data) => data.map(intoGitBranchData));

export const deleteBranch = (args: Args & CredsArgs & { name: string; remote: boolean }) =>
	rustCall<void>("git.delete_branch", args);

export const newBranch = (args: Args & { name: string }) => rustCall<void>("git.new_branch", args);

export const addRemote = (args: Args & { name: string; url: string }) => rustCall<void>("git.add_remote", args);

export const hasRemotes = (args: Args) => rustCall<boolean>("git.has_remotes", args);

export const stash = (args: CredsArgs & { message: string | null }) => rustCall<Oid>("git.stash", args);

export const stashApply = (args: Args & { oid: Oid }) => rustCall<MergeResult>("git.stash_apply", args);

export const stashDelete = (args: Args & { oid: Oid }) => rustCall<void>("git.stash_delete", args);

export const reset = (args: Args & { opts: ResetOptions }) => rustCall<void>("git.reset", args);

export const commit = (args: Args & CredsArgs & { opts: CommitOptions }) => rustCall<void>("git.commit", args);

export const checkout = (args: Args & CredsArgs & { refName: string; force: boolean }) =>
	rustCall<void>("git.checkout", args);

export const graphHeadUpstreamFiles = (args: Args & { searchIn: string }) =>
	rustCall<UpstreamCountFileChanges>("git.count_changed_files", args);

export const getContent = (args: Args & { path: string; oid?: string }) => rustCall<string>("git.get_content", args);

export const getCommitInfo = (
	args: Args & {
		oid: string;
		opts: GetCommitInfoOpts;
	},
) => rustCall<RawCommitInfo[]>("git.get_commit_info", args);

export const getParent = (args: Args & { oid: string }) => rustCall<string>("git.get_parent", args);

export const getRemoteUrl = (args: Args) => rustCall<string>("git.get_remote", args);

export const restore = (args: Args & { staged: boolean; paths: string[] }) => rustCall<void>("git.restore", args);

export const readFile = (args: Args & { path: string; scope: TreeReadScope }) =>
	rustCall<ArrayBuffer>("git.git_read_file", args);

export const readDir = (args: Args & { path: string; scope: TreeReadScope }) =>
	rustCall<DirEntry[]>("git.git_read_dir", args);

export const fileStat = (args: Args & { path: string; scope: TreeReadScope }) =>
	rustCall<FileStat>("git.git_file_stat", args);

export const readDirStats = (args: Args & { path: string; scope: TreeReadScope }) =>
	rustCall<DirStat[]>("git.git_read_dir_stats", args);

export const fileExists = (args: Args & { path: string; scope: TreeReadScope }) =>
	rustCall<boolean>("git.git_file_exists", args);

export const setHead = (args: Args & { refname: string }) => rustCall<void>("git.set_head", args);

export const isInit = (args: Args) => rustCall<boolean>("git.is_init", args);

export const isBare = (args: Args) => rustCall<boolean>("git.is_bare", args);

export const getRefsByGlobs = (args: Args & { patterns: string[] }) =>
	rustCall<RefInfo[]>("git.find_refs_by_globs", args);

export const defaultBranch = (args: Args & { creds: Creds }) =>
	rustCall<GitBranchData[] | null>("git.default_branch", args).then((data) =>
		data ? intoGitBranchData(data) : null,
	);

export const getCommitAuthors = (args: Args) => rustCall<CommitAuthorInfo[]>("git.get_all_commit_authors", args);

export const gc = (args: Args & { opts: GcOptions }) => rustCall<void>("git.gc", args);

export const lfsPrune = (args: Args) => rustCall<number>("git.lfs_prune", args);

export const healthcheck = (args: Args) => rustCall<void>("git.healthcheck", args);

export const storageStats = (args: Args) => rustCall<StorageStats>("git.storage_stats", args);

export const resetRepo = () => rustCall<void>("git.reset_repo", { unused: null });

export const pullLfsObjects = (args: CredsArgs & { paths: string[]; checkout: boolean; cancelToken: number }) =>
	rustCall<void>("git.pull_lfs_objects", args);

export const resetFileLock = (args: Args) => rustCall<void>("git.reset_file_lock", args);

export const formatMergeMessage = (args: Args & CredsArgs & { opts: MergeMessageFormatOptions }) => {
	args.opts = intoMergeMessageFormatOptions(args.opts);
	return rustCall<string>("git.format_merge_message", args);
};

export const getConfigVal = (args: Args & { name: string }) => rustCall<string | null>("git.get_config_val", args);

export const setConfigVal = (args: Args & { name: string; val: ConfigValue }) =>
	rustCall<void>("git.set_config_val", args);

const intoGitBranchData = (data: any): GitBranchData & { lastCommitOid: string } => {
	return {
		name: data.name,
		lastCommitAuthor: data.lastAuthorName,
		lastCommitAuthorMail: data.lastAuthorEmail,
		lastCommitModify: new Date(data.modify * 1000).toISOString(),
		remoteName: data.remoteName,
		lastCommitOid: data.lastCommitOid,
	};
};

const intoMergeOptions = (data: any): MergeOptions => {
	return {
		theirs: data.theirs,
		deleteAfterMerge: data.deleteAfterMerge || false,
		squash: data.squash || false,
		isMergeRequest: data.isMergeRequest || false,
	};
};

const intoMergeMessageFormatOptions = (data: any): MergeMessageFormatOptions => {
	return {
		theirs: data.theirs,
		squash: data.squash || false,
		maxCommits: data.maxCommits || null,
		isMergeRequest: data.isMergeRequest || false,
	};
};

const intoMergeRequest = (data: any): MergeRequest => {
	return {
		...data,
		creator: AuthorInfoCodec.deserialize(data.creator),
		createdAt: timeFromUtc(data.createdAt),
		updatedAt: timeFromUtc(data.updatedAt),
		approvers: data.approvers.map((a: any) => ({
			approvedAt: timeFromUtc(a.approvedAt),
			...AuthorInfoCodec.deserialize(a.user),
		})),
	};
};

const tz = new Date().getTimezoneOffset() / 60;
const timeFromUtc = (time: Date | string) => {
	if (!time) return null;
	const utc = time instanceof Date ? time : new Date(time.replace(" ", "T"));
	utc.setHours(utc.getHours() - tz);
	return utc;
};

export const formatTime = (time: Date) => {
	if (!time) return null;
	return time.toISOString().slice(0, 19).replace("T", " ");
};
