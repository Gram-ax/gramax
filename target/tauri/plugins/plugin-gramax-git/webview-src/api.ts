import GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import GitProgressEvent from "@ext/git/core/model/GitProgressEvent";
import { VersionControlInfo } from "@ext/VersionControl/model/VersionControlInfo";
import { listen } from "@tauri-apps/api/event";
import { invoke, InvokeArgs } from "@tauri-apps/api/primitives";
import { LibGit2Error } from "./error";

let onProgressCallback = undefined;

void listen("clone-progress", (ev) => {
	const payload = ev.payload as any;
	onProgressCallback?.({
		phase: "receiving-objects",
		percent: (payload.received / payload.total) * 100,
		loaded: payload.received as number,
		total: payload.total as number,
	});
});

const call = async <O>(command: string, args?: InvokeArgs): Promise<O> => {
	try {
		return await invoke<O>(`plugin:gramaxgit|${command}`, args);
	} catch (err) {
		if ((args as CredsArgs)?.creds?.accessToken) (args as CredsArgs).creds.accessToken = "<redacted>";
		console.error(`git-command ${command} ${JSON.stringify(args, null, 4)} returned an error`);
		console.error(err);
		const error = JSON.parse(err);
		throw new LibGit2Error(error.message, error.class, error.code);
	}
};

type Args = InvokeArgs & {
	repoPath: string;
};

type CredsArgs = Args & {
	creds: {
		authorName: string;
		authorEmail: string;
		accessToken: string;
	};
};

type Oid = string;

export const clone = async (
	args: CredsArgs & { remoteUrl: string; branch?: string },
	onProgress?: (progress: GitProgressEvent) => void,
) => {
	onProgressCallback = onProgress;
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
			date: new Date(i.date).toString(),
			content: i.content as string,
			parentContent: i.parentContent as string,
		}),
	);
};

export const status = (args: Args) => call<[{ path: string; status: string }]>("status", args);

export const fetch = (args: Args) => call<void>("fetch", args);
export const merge = (args: CredsArgs & { theirs: string }) => call<void>("merge", args);
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

export const deleteBranch = (args: Args & { name: string }) => call<void>("delete_branch", args);

export const newBranch = (args: Args & { name: string }) => call<void>("new_branch", args);

export const addRemote = (args: Args & { name: string; url: string }) => call<void>("add_remote", args);

export const hasRemotes = (args: Args) => call<boolean>("has_remotes", args);

export const stash = (args: CredsArgs & { message?: string }) => call<Oid>("stash", args);

export const stashApply = (args: Args & { oid: Oid }) => call<void>("stash_apply", args);

export const stashDelete = (args: Args & { oid: Oid }) => call<void>("stash_delete", args);

export const resetAll = (args: Args & { hard: boolean; head?: string }) => call<void>("reset_all", args);

export const commit = (args: CredsArgs & { message: string; parents?: string[] }) => call<Oid>("commit", args);

export const checkout = (args: Args & { refName: string; force: boolean }) => call<void>("checkout", args);

export const getContent = (args: Args & { path: string; oid?: string }) => call<string>("get_content", args);

export const getParent = (args: Args & { oid: string }) => call<string>("get_parent", args);

export const getRemoteUrl = (args: Args) => call<string>("get_remote", args);

export const restore = (args: Args & { staged: boolean; paths: string[] }) => call<void>("restore", args);

const intoGitBranchData = (data: any): GitBranchData & { lastCommitOid: string } => {
	return {
		name: data.name,
		lastCommitAuthor: data.lastAuthorName,
		lastCommitModify: new Date(data.modify * 1000).toString(),
		remoteName: data.remoteName,
		lastCommitOid: data.lastCommitOid,
	};
};
