import { getExecutingEnvironment } from "@app/resolveModule/env";
import call from "@app/resolveModule/gitcall";
import Path from "@core/FileProvider/Path/Path";
import AuthorInfoCodec from "@core-ui/utils/authorInfoCodec";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import type {
	DiffConfig,
	DiffTree2TreeInfo,
	DirEntry,
	DirStat,
	FileStat,
	GcOptions,
	MergeMessageFormatOptions,
	MergeOptions,
	RemoteProgress,
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
};

export type CredsArgs = Args & { creds: Creds };

export type UpstreamCountFileChanges = {
	pull: number;
	push: number;
	changed: number;
	hasChanges: boolean;
};

export type MergeResult = {
	ours?: string;
	theirs?: string;
	ancestor?: string;
}[];

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
		await call<any>("clone", args);
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
		await call<void>("recover", args);
	} finally {
		delete progress[args.cancelToken];
	}
};

export const cancel = (id: number) => call<boolean>("cancel", { id });

export const getAllCancelTokens = () => call<number[]>("get_all_cancel_tokens", {});

export const init = (args: CredsArgs) => call<Oid>("init_new", args);

export const fileHistory = async (args: Args & { filePath: string; count: number }) => {
	const infos = await call<any[]>("file_history", args);
	return infos.map(
		(i): VersionControlInfo => ({
			version: i.commitOid as string,
			author: i.authorName as string,
			date: new Date(i.date).toISOString(),
			path: new Path(i.path as string),
			content: i.content as string,
			parentPath: new Path(i.parentPath as string),
			parentContent: i.parentContent as string,
		}),
	);
};

export const listMergeRequests = async (args: Args): Promise<MergeRequest[]> => {
	const mrs = await call<any[]>("list_merge_requests", args);
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

	await call<void>("create_or_update_merge_request", args);
};

export const getDraftMergeRequest = async (args: Args) => {
	const data = await call<MergeRequest | undefined>("get_draft_merge_request", args);
	return data ? intoMergeRequest(data) : undefined;
};

export const status = (args: Args & { index: boolean }) => call<[{ path: string; status: string }]>("status", args);

export const statusFile = (args: Args & { filePath: string }) => call<string>("status_file", args);

export const fetch = (args: CredsArgs & { opts: RemoteOptions; lock: boolean }) => call<void>("fetch", args);

export const merge = (args: CredsArgs & { opts: MergeOptions }) => {
	args.opts = intoMergeOptions(args.opts);
	return call<MergeResult>("merge", args);
};

export const push = (args: CredsArgs) => call<void>("push", args);

export const add = (args: Args & { patterns: string[]; force: boolean }) => call<void>("add", args);

export const diff = (args: Args & { opts: DiffConfig }) => call<DiffTree2TreeInfo>("diff", args);

export const branchInfo = async (
	args: Args & { name?: string },
): Promise<GitBranchData & { lastCommitOid: string }> => {
	if (args.name == "HEAD") delete args.name;
	const data = await call<any>("branch_info", args);
	return intoGitBranchData(data);
};

export const getAllBranches = (args: Args) =>
	call<GitBranchData[]>("branch_list", args).then((data) => data.map(intoGitBranchData));

export const deleteBranch = (args: Args & CredsArgs & { name: string; remote: boolean }) =>
	call<void>("delete_branch", args);

export const newBranch = (args: Args & { name: string }) => call<void>("new_branch", args);

export const addRemote = (args: Args & { name: string; url: string }) => call<void>("add_remote", args);

export const hasRemotes = (args: Args) => call<boolean>("has_remotes", args);

export const stash = (args: CredsArgs & { message: string | null }) => call<Oid>("stash", args);

export const stashApply = (args: Args & { oid: Oid }) => call<MergeResult>("stash_apply", args);

export const stashDelete = (args: Args & { oid: Oid }) => call<void>("stash_delete", args);

export const reset = (args: Args & { opts: ResetOptions }) => call<void>("reset", args);

export const commit = (args: Args & CredsArgs & { opts: CommitOptions }) => call<void>("commit", args);

export const checkout = (args: Args & CredsArgs & { refName: string; force: boolean }) => call<void>("checkout", args);

export const graphHeadUpstreamFiles = (args: Args & { searchIn: string }) =>
	call<UpstreamCountFileChanges>("count_changed_files", args);

export const getContent = (args: Args & { path: string; oid?: string }) => call<string>("get_content", args);

export const getCommitInfo = (args: Args & { oid: string; opts: { depth: number; simplify: boolean } }) =>
	call<RawCommitInfo[]>("get_commit_info", args);

export const getParent = (args: Args & { oid: string }) => call<string>("get_parent", args);

export const getRemoteUrl = (args: Args) => call<string>("get_remote", args);

export const restore = (args: Args & { staged: boolean; paths: string[] }) => call<void>("restore", args);

export const readFile = (args: Args & { path: string; scope: TreeReadScope }) =>
	call<ArrayBuffer>("git_read_file", args);

export const readDir = (args: Args & { path: string; scope: TreeReadScope }) => call<DirEntry[]>("git_read_dir", args);

export const fileStat = (args: Args & { path: string; scope: TreeReadScope }) => call<FileStat>("git_file_stat", args);

export const readDirStats = (args: Args & { path: string; scope: TreeReadScope }) =>
	call<DirStat[]>("git_read_dir_stats", args);

export const fileExists = (args: Args & { path: string; scope: TreeReadScope }) =>
	call<boolean>("git_file_exists", args);

export const setHead = (args: Args & { refname: string }) => call<void>("set_head", args);

export const isInit = (args: Args) => call<boolean>("is_init", args);

export const isBare = (args: Args) => call<boolean>("is_bare", args);

export const getRefsByGlobs = (args: Args & { patterns: string[] }) => call<RefInfo[]>("find_refs_by_globs", args);

export const defaultBranch = (args: Args & { creds: Creds }) =>
	call<GitBranchData[] | null>("default_branch", args).then((data) => (data ? intoGitBranchData(data) : null));

export const getCommitAuthors = (args: Args) => call<CommitAuthorInfo[]>("get_all_commit_authors", args);

export const gc = (args: Args & { opts: GcOptions }) => call<void>("gc", args);

export const healthcheck = (args: Args) => call<void>("healthcheck", args);

export const resetRepo = () => call<void>("reset_repo", { unused: null });

export const pullLfsObjects = (args: CredsArgs & { paths: string[]; checkout: boolean; cancelToken: number }) =>
	call<void>("pull_lfs_objects", args);

export const resetFileLock = (args: Args) => call<void>("reset_file_lock", args);

export const formatMergeMessage = (args: Args & CredsArgs & { opts: MergeMessageFormatOptions }) => {
	args.opts = intoMergeMessageFormatOptions(args.opts);
	return call<string>("format_merge_message", args);
};

export const getConfigVal = (args: Args & { name: string }) => call<string | null>("get_config_val", args);

export const setConfigVal = (args: Args & { name: string; val: ConfigValue }) => call<void>("set_config_val", args);

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
