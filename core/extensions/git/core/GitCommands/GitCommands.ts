import { getExecutingEnvironment } from "@app/resolveModule/env";
import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import fixConflictLibgit2 from "@ext/git/actions/MergeConflictHandler/logic/FixConflictLibgit2";
import { GitAutoMerger } from "@ext/git/core/GitAutoMerger/GitAutoMerger";
import getGitError from "@ext/git/core/GitCommands/errors/logic/getGitError";
import type { Caller } from "@ext/git/core/GitCommands/errors/model/Caller";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import LibGit2Commands from "@ext/git/core/GitCommands/LibGit2Commands";
import type {
	CommitAuthorInfo,
	ConfigValue,
	MergeResult,
	UpstreamCountFileChanges,
} from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import getUrlFromGitStorageData from "@ext/git/core/GitStorage/utils/getUrlFromGitStorageData";
import type GitVersionData from "@ext/git/core/model/GitVersionData";
import t from "@ext/localization/locale/translate";
import { trace } from "@ext/loggers/opentelemetry";
import assert from "assert";
import type FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import Path from "../../../../logic/FileProvider/Path/Path";
import type SourceData from "../../../storage/logic/SourceDataProvider/model/SourceData";
import type { VersionControlInfo } from "../../../VersionControl/model/VersionControlInfo";
import type { GitBranch } from "../GitBranch/GitBranch";
import type { GitStatus } from "../GitWatcher/model/GitStatus";
import type GitSourceData from "../model/GitSourceData.schema";
import GitStash from "../model/GitStash";
import type GitStorageData from "../model/GitStorageData";
import { GitVersion } from "../model/GitVersion";
import GitError from "./errors/GitError";
import type GitCommandsModel from "./model/GitCommandsModel";
import type {
	CancelToken,
	DiffConfig,
	DiffTree2TreeInfo,
	DirEntry,
	DirStat,
	FileStat,
	GcOptions,
	MergeOptions,
	RefInfo,
	RemoteProgress,
	ResetOptions,
	TreeReadScope,
} from "./model/GitCommandsModel";

export type GitCommandsEvents = Event<"fetch", { commands: GitCommands; force: boolean }>;

export type CloneOptions = {
	branch?: string;
	depth?: number;
	isBare?: boolean;
	onProgress?: (progress: RemoteProgress) => void;
	allowNonEmptyDir?: boolean;
	skipLfsPull?: boolean;
};

export class GitCommands {
	private _impl: GitCommandsModel;
	private _events = createEventEmitter<GitCommandsEvents>();
	private _autoMerger: GitAutoMerger;

	constructor(
		private _fp: FileProvider,
		private _repoPath: Path,
	) {
		this._impl = new LibGit2Commands(this._fp.rootPath.join(_repoPath));
		this._autoMerger = new GitAutoMerger(this._fp, this, _repoPath);
	}

	get repoPath() {
		return this._repoPath;
	}

	get events() {
		return this._events;
	}

	inner() {
		return this._impl;
	}

	isInit(): Promise<boolean> {
		try {
			return this._impl.isInit();
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	async isBare(): Promise<boolean> {
		try {
			return await this._impl.isBare();
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	hasRemote(): Promise<boolean> {
		try {
			return this._impl.hasRemote();
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	async init(data: SourceData) {
		try {
			await this._impl.init(data);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async addRemote(data: GitStorageData) {
		const url = getUrlFromGitStorageData(data, true);
		try {
			await this._impl.addRemote(url);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value, remoteUrl: url });
		}
		await this.push(data.source);
	}

	@trace()
	async getCurrentBranch(data?: GitSourceData): Promise<GitBranch> {
		try {
			return await this._impl.getCurrentBranch(data);
		} catch (err) {
			throw new GitError(
				GitErrorCode.CurrentBranchNotFoundError,
				err,
				{ repositoryPath: this._repoPath.value },
				"branch",
			);
		}
	}

	@trace()
	async getCurrentBranchName(): Promise<string> {
		try {
			return await this._impl.getCurrentBranchName();
		} catch (err) {
			throw new GitError(
				GitErrorCode.CurrentBranchNotFoundError,
				err,
				{ repositoryPath: this._repoPath.value },
				"branch",
			);
		}
	}

	@trace()
	async getAllBranches(): Promise<GitBranch[]> {
		let branches: GitBranch[];
		try {
			branches = await this._impl.getAllBranches();
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
		return branches
			.filter((b) => !b.getData().name.includes("HEAD"))
			.sort(
				(a, b) =>
					new Date(b.getData().lastCommitModify).getTime() - new Date(a.getData().lastCommitModify).getTime(),
			);
	}

	@trace()
	async getDefaultBranch(source: SourceData): Promise<GitBranch | null> {
		try {
			return await this._impl.getDefaultBranch(source);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async getBranch(branchName: string): Promise<GitBranch> {
		const branch = await this._impl.getBranch(branchName);
		if (!branch)
			throw new GitError(
				GitErrorCode.NotFoundError,
				null,
				{ repositoryPath: this._repoPath.value, what: branchName },
				"branch",
			);
		return branch;
	}

	@trace()
	async getRemoteBranchName(name: string, data?: GitSourceData): Promise<string> {
		try {
			return await this._impl.getRemoteBranchName(name, data);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value, branchName: name });
		}
	}

	@trace()
	async getCommitHash(ref = "HEAD"): Promise<GitVersion> {
		try {
			return await this._impl.getCommitHash(ref);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async getHeadCommit(ref: GitBranch | string = "HEAD"): Promise<GitVersion> {
		try {
			return this._impl.getHeadCommit(ref.toString());
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value, branchName: ref.toString() });
		}
	}

	@trace()
	async createNewBranch(newBranchName: string) {
		try {
			await this._impl.newBranch(newBranchName);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value, branchName: newBranchName }, "branch");
		}
	}

	@trace()
	async deleteBranch(branchName: GitBranch | string, remote?: boolean, data?: GitSourceData): Promise<void> {
		const currentBranch = await this.getCurrentBranch();
		if (
			branchName.toString() === currentBranch.toString() ||
			branchName.toString() === currentBranch.getData().remoteName
		) {
			throw new GitError(GitErrorCode.DeleteCurrentBranch, null, {
				repositoryPath: this._repoPath.value,
			});
		}
		try {
			await this._impl.deleteBranch(branchName.toString(), remote, data);
		} catch (e) {
			throw getGitError(
				e,
				{ repositoryPath: this._repoPath.value, branchName: branchName.toString() },
				"deleteBranch",
			);
		}
	}

	@trace()
	async getCommitAuthors(): Promise<CommitAuthorInfo[]> {
		return this._impl.getCommitAuthors();
	}

	@trace()
	async setHead(refname: string) {
		try {
			return await this._impl.setHead(refname);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async checkout(
		data: GitSourceData,
		ref: GitVersion | GitBranch | string,
		{ force, caller }: { force?: boolean; caller?: Caller } = {},
	): Promise<void> {
		try {
			await this.getBranch(ref.toString());
		} catch (e) {
			throw new GitError(
				GitErrorCode.NotFoundError,
				e,
				{ repositoryPath: this._repoPath.value, what: ref.toString() },
				"checkout",
			);
		}

		try {
			await this._impl.checkout(data, ref.toString(), force);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value }, caller ?? "checkout");
		}
	}

	@trace()
	async clone(url: string, source: GitSourceData, cancelToken: CancelToken, opts: CloneOptions = {}): Promise<void> {
		const newUrl = url.endsWith(".git") ? url : `${url}.git`;

		if (
			!opts.allowNonEmptyDir &&
			(await this._fp.exists(this._repoPath)) &&
			(await this._fp.readdir(this._repoPath)).length > 0
		) {
			throw new GitError(
				GitErrorCode.AlreadyExistsError,
				null,
				{ repositoryPath: this._repoPath.value },
				"clone",
			);
		}

		try {
			await this._impl.clone(
				newUrl,
				source,
				cancelToken,
				opts.branch,
				opts.depth,
				opts.isBare,
				opts.allowNonEmptyDir,
				opts.skipLfsPull,
				opts.onProgress,
			);
		} catch (e) {
			throw new GitError(
				e instanceof GitError ? e.props.errorCode : GitErrorCode.CloneError,
				e instanceof GitError ? e.cause || e : e,
				{ repositoryPath: this._repoPath.value, remoteUrl: newUrl, branchName: opts.branch },
				"clone",
				null,
				t("git.clone.error.cannot-clone"),
			);
		}
	}

	@trace()
	async recover(
		data: GitSourceData,
		cancelToken: CancelToken,
		onProgress: (progress: RemoteProgress) => void,
	): Promise<void> {
		return await this._impl.recover(data, cancelToken, onProgress);
	}

	@trace()
	async cancel(cancelToken: CancelToken): Promise<boolean> {
		return await this._impl.cancel(cancelToken);
	}

	@trace()
	async getAllCancelTokens(): Promise<number[]> {
		try {
			return this._impl.getAllCancelTokens();
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async add(filePaths?: Path[], force = false): Promise<void> {
		try {
			return await this._impl.add(filePaths, force);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async pullLfsObjects(
		data: GitSourceData,
		paths: Path[],
		checkout: boolean,
		cancelToken: CancelToken,
	): Promise<void> {
		try {
			return await this._impl.pullLfsObjects(
				data,
				paths.map((p) => p.value),
				checkout,
				cancelToken,
			);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async reset(opts: ResetOptions): Promise<void> {
		try {
			return await this._impl.reset(opts);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async stash(data: SourceData): Promise<GitStash> {
		const res = await this._impl.stash(data);
		return res && new GitStash(res);
	}

	@trace()
	async applyStash(stashOid: GitStash): Promise<MergeResult> {
		const res = await this._impl.applyStash(stashOid.toString());

		const fixedConflict = await fixConflictLibgit2(
			res,
			this._fp,
			this._repoPath,
			this,
			await this.getHeadCommit(),
			stashOid,
		);

		return await this._autoMerger.merge(fixedConflict);
	}

	@trace()
	async deleteStash(stashHash: GitStash): Promise<void> {
		try {
			return await this._impl.deleteStash(stashHash.toString());
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async stashParent(stashOid: GitStash): Promise<GitVersion> {
		try {
			return await this._impl.stashParent(stashOid.toString());
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async pull(data: GitSourceData) {
		try {
			await this.fetch(data);
			const remoteBranchName = (await this.getCurrentBranch()).getData().remoteName?.replace("origin/", "");
			if (!remoteBranchName) return;

			const remoteWithRemoteBranchName = `${await this.getRemoteName()}/${remoteBranchName}`;

			await this.merge(data, { theirs: remoteWithRemoteBranchName });
		} catch (e) {
			throw e.props ? e : getGitError(e, { repositoryPath: this._repoPath.value }, "pull");
		}
	}

	@trace()
	async push(data: GitSourceData): Promise<void> {
		try {
			await this._impl.push(data);
		} catch (e) {
			const origin = await this.getRemoteUrl();
			throw getGitError(e, { repositoryPath: this._repoPath.value, remoteUrl: origin }, "push");
		}
	}

	@trace()
	async fetch(data: GitSourceData, force = false, lock = true): Promise<void> {
		try {
			await this._impl.fetch(data, force, lock);
			await this._events.emit("fetch", { commands: this, force });
		} catch (e) {
			const origin = await this.getRemoteUrl();
			throw getGitError(e, { repositoryPath: this._repoPath.value, remoteUrl: origin }, "fetch");
		}
	}

	@trace()
	async merge(data: GitSourceData, opts: MergeOptions): Promise<MergeResult> {
		assert(opts, "merge opts is required");
		assert(opts.theirs, "opts.theirs is required");

		const head = await this.getCurrentBranch();
		const mergeResult = await this._impl.merge(data, opts);
		if (!mergeResult.length) await this.checkout(data, head, { force: true });

		const fixedConflict = await fixConflictLibgit2(
			mergeResult,
			this._fp,
			this._repoPath,
			this,
			await this.getHeadCommit(),
			await this.getHeadCommit(opts.theirs),
		);

		return await this._autoMerger.merge(fixedConflict);
	}

	@trace()
	async formatMergeMessage(data: SourceData, opts: MergeOptions): Promise<string> {
		assert(opts, "merge opts is required");
		assert(opts.theirs, "opts.theirs is required");
		return await this._impl.formatMergeMessage(data, opts);
	}

	@trace()
	async commit(
		message: string,
		data: SourceData,
		parents?: (string | GitBranch)[],
		files?: Path[],
	): Promise<GitVersion> {
		try {
			return await this._impl.commit(
				message,
				data,
				parents?.map((x) => x.toString()),
				files?.map((x) => x.value),
			);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value }, "commit");
		}
	}

	@trace()
	async status(type: "index" | "workdir" = "workdir"): Promise<GitStatus[]> {
		try {
			return await this._impl.status(type);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async fileStatus(filePath: Path): Promise<GitStatus> {
		try {
			return await this._impl.fileStatus(filePath);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	/**
	 * @deprecated use GitTreeFileProvider instead
	 */
	@trace()
	async showFileContent(filePath: Path, ref?: GitVersion | GitStash): Promise<string> {
		try {
			return await this._impl.showFileContent(filePath, ref);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async getFileHistory(filePath: Path, offset = 0, limit = 15): Promise<VersionControlInfo[]> {
		try {
			return await this._impl.getFileHistory(filePath, offset, limit);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async getRemoteUrl(): Promise<string> {
		try {
			return await this._impl.getRemoteUrl();
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async getParentCommit(commitOid: GitVersion): Promise<GitVersion> {
		try {
			const oid = await this._impl.getParentCommit(commitOid.toString());
			return new GitVersion(oid);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	countChangedFiles(searchIn: string): Promise<UpstreamCountFileChanges> {
		try {
			return this._impl.countChangedFiles(searchIn);
		} catch {
			return Promise.resolve({ pull: 0, push: 0, changed: 0, hasChanges: false });
		}
	}

	@trace()
	async restore(staged: boolean, filePaths: Path[]): Promise<void> {
		try {
			return await this._impl.restore(staged, filePaths);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async diff(opts: DiffConfig): Promise<DiffTree2TreeInfo> {
		try {
			return await this._impl.diff(opts);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	@trace()
	async haveConflictsWithBranch(branch: GitBranch | string, data: GitSourceData): Promise<boolean> {
		// temp implementation
		const before = await this.getHeadCommit();
		const isBrowser = getExecutingEnvironment() === "browser";
		if (!isBrowser) await this.add();

		assert((await this.status("index")).length === 0, "Can't check conflicts if there are local changes");

		const haveConflicts = (await this.merge(data, { theirs: branch.toString() })).length > 0;
		await this.reset({ mode: "hard", head: before });
		return haveConflicts;
	}

	@trace()
	async getCommitInfo(oid: GitVersion, opts: { depth: number; simplify: boolean }): Promise<GitVersionData[]> {
		try {
			return await this._impl.getCommitInfo(oid.toString(), opts);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	getRemoteName(): Promise<string> {
		const REMOTE = "origin";
		return Promise.resolve(REMOTE);
	}

	readFile(filePath: Path, scope: TreeReadScope): Promise<ArrayBuffer> {
		try {
			return this._impl.readFile(this._truncatePath(filePath), scope);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	readDir(dirPath: Path, scope: TreeReadScope): Promise<DirEntry[]> {
		try {
			return this._impl.readDir(this._truncatePath(dirPath), scope);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	fileStat(filePath: Path, scope: TreeReadScope): Promise<FileStat> {
		try {
			return this._impl.fileStat(this._truncatePath(filePath), scope);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	readDirStats(dirPath: Path, scope: TreeReadScope): Promise<DirStat[]> {
		try {
			return this._impl.readDirStats(this._truncatePath(dirPath), scope);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	fileExists(filePath: Path, scope: TreeReadScope): Promise<boolean> {
		try {
			return this._impl.fileExists(this._truncatePath(filePath), scope);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	getReferencesByGlob(patterns: string[]): Promise<RefInfo[]> {
		try {
			return this._impl.getReferencesByGlob(patterns);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	async gc(opts: GcOptions): Promise<void> {
		try {
			return await this._impl.gc(opts);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	async healthcheck(): Promise<void> {
		try {
			return await this._impl.healthcheck();
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	async getConfigVal(name: string): Promise<string> {
		return await this._impl.getConfigVal(name);
	}

	async setConfigVal(name: string, val: ConfigValue): Promise<void> {
		return await this._impl.setConfigVal(name, val);
	}

	// todo: optimize
	private _truncatePath(path: Path): Path {
		let newPath = path;
		const name = this.repoPath.nameWithExtension;
		const root = newPath.rootDirectory?.value || "";
		if (!(root.startsWith(name) && (!root[name.length] || root[name.length] === ":")))
			return newPath.value[0] === "/" ? new Path(newPath.value.substring(1)) : newPath;

		const parts = newPath.value.split("/").filter(Boolean);
		if (parts.length > 0) parts.shift();
		newPath = new Path(parts.join("/"));

		return newPath;
	}
}

export default GitCommands;
