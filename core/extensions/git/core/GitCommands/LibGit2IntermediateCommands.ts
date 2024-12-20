import call from "@app/resolveModule/gitcall";
import Path from "@core/FileProvider/Path/Path";
import { VersionControlInfo } from "@ext/VersionControl/model/VersionControlInfo";
import GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import type {
	CloneProgress,
	DirEntry,
	DirStat,
	FileStat,
	TreeReadScope,
} from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type { CreateMergeRequest, MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";

export let onCloneProgress = undefined;

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

export type CredsArgs = Args & { creds: Creds };

export type UpstreamCountFileChanges = {
	pull: number;
	push: number;
	hasChanges: boolean;
};

export type MergeResult = {
	ours?: string;
	theirs?: string;
	ancestor?: string;
}[];

export const clone = async (
	args: { creds: Creds; opts: { url: string; to: string; branch?: string; depth?: number; isBare?: boolean } },
	onProgress?: (progress: CloneProgress) => void,
) => {
	onCloneProgress = onProgress;
	try {
		await call<any>("clone", args);
	} finally {
		onProgress = undefined;
	}
};

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

	if (args.mergeRequest.assignees) {
		args.mergeRequest.assignees = args.mergeRequest.assignees.map((assignee) => ({
			signature: `${assignee.name} <${assignee.email}>`,
			approvedAt: formatTime(assignee.approvedAt),
		})) as any;
	}

	await call<void>("create_or_update_merge_request", args);
};

export const getDraftMergeRequest = async (args: Args) => {
	const data = await call<MergeRequest | undefined>("get_draft_merge_request", args);
	return data ? intoMergeRequest(data) : undefined;
};

export const status = (args: Args) => call<[{ path: string; status: string }]>("status", args);

export const statusFile = (args: Args & { filePath: string }) => call<string>("status_file", args);

export const fetch = (args: CredsArgs & { force: boolean }) => call<void>("fetch", args);
export const merge = (args: CredsArgs & { theirs: string }) => call<MergeResult>("merge", args);
export const push = (args: CredsArgs) => call<void>("push", args);

export const add = (args: Args & { patterns: string[] }) => call<void>("add", args);
export const diff = (args: Args & { old: string; new: string }) =>
	call<[{ path: string; status: string }]>("diff", args);

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

export const stash = (args: CredsArgs & { message: string }) => call<Oid>("stash", args);

export const stashApply = (args: Args & { oid: Oid }) => call<MergeResult>("stash_apply", args);

export const stashDelete = (args: Args & { oid: Oid }) => call<void>("stash_delete", args);

export const resetAll = (args: Args & { hard: boolean; head?: string }) => call<void>("reset_all", args);

export const commit = (args: Args & CredsArgs & { message: string; parents?: string[] }) => call<void>("commit", args);

export const checkout = (args: Args & { refName: string; force: boolean }) => call<void>("checkout", args);

export const graphHeadUpstreamFiles = (args: Args & { searchIn: string }) =>
	call<UpstreamCountFileChanges>("graph_head_upstream_files", args);

export const getContent = (args: Args & { path: string; oid?: string }) => call<string>("get_content", args);

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

export const invalidateRepoCache = (args: { repoPaths: string[] }) => call<void>("invalidate_repo_cache", args);

const intoGitBranchData = (data: any): GitBranchData & { lastCommitOid: string } => {
	return {
		name: data.name,
		lastCommitAuthor: data.lastAuthorName,
		lastCommitModify: new Date(data.modify * 1000).toISOString(),
		remoteName: data.remoteName,
		lastCommitOid: data.lastCommitOid,
	};
};

const intoMergeRequest = (data: any): MergeRequest => {
	return {
		...data,
		author: intoSignatureInfo(data.author),
		createdAt: timeFromUtc(data.createdAt),
		updatedAt: timeFromUtc(data.updatedAt),
		assignees: data.assignees.map((a: any) => ({
			approvedAt: timeFromUtc(a.approvedAt),
			...intoSignatureInfo(a.signature),
		})),
	};
};

const intoSignatureInfo = (data: string) => {
	if (!data) return;
	return {
		name: data.slice(0, data.indexOf("<")).trim(),
		email: data.slice(data.indexOf("<") + 1, data.lastIndexOf(">")).trim(),
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
