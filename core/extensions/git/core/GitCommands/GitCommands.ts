import { getExecutingEnvironment } from "@app/resolveModule/env";
import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import fixConflictLibgit2 from "@ext/git/actions/MergeConflictHandler/logic/FixConflictLibgit2";
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
import PersistentLogger from "@ext/loggers/PersistentLogger";
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
import GitCommandsModel, {
	type CancelToken,
	type DiffConfig,
	type DiffTree2TreeInfo,
	type DirEntry,
	type DirStat,
	type FileStat,
	type GcOptions,
	type MergeOptions,
	type RefInfo,
	type RemoteProgress,
	type ResetOptions,
	type TreeReadScope,
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

	constructor(
		private _fp: FileProvider,
		private _repoPath: Path,
	) {
		this._impl = new LibGit2Commands(this._fp.rootPath.join(_repoPath));
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
		await this._logWrapper("init", "Initing repo", async () => {
			try {
				await this._impl.init(data);
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value });
			}
		});
	}

	async addRemote(data: GitStorageData) {
		const url = getUrlFromGitStorageData(data, true);
		await this._logWrapper("addRemote", `Adding remote url: '${url}'`, async () => {
			try {
				await this._impl.addRemote(url);
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value, remoteUrl: url });
			}
			await this.push(data.source);
		});
	}

	async getCurrentBranch(data?: GitSourceData): Promise<GitBranch> {
		return await this._logWrapper("getCurrentBranch", "Getting current branch", async () => {
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
		});
	}

	async getCurrentBranchName(): Promise<string> {
		return await this._logWrapper("getCurrentBranchName", "Getting current branch name (string)", async () => {
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
		});
	}

	async getAllBranches(): Promise<GitBranch[]> {
		return await this._logWrapper("getAllBranches", "Getting all branches", async () => {
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
						new Date(b.getData().lastCommitModify).getTime() -
						new Date(a.getData().lastCommitModify).getTime(),
				);
		});
	}

	async getDefaultBranch(source: SourceData): Promise<GitBranch | null> {
		return await this._logWrapper("getDefaultBranch", "Getting default branch", async () => {
			try {
				return await this._impl.getDefaultBranch(source);
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value });
			}
		});
	}

	async getBranch(branchName: string): Promise<GitBranch> {
		return await this._logWrapper("getBranch", `Getting branch ${branchName} failed`, async () => {
			const branch = await this._impl.getBranch(branchName);
			if (!branch)
				throw new GitError(
					GitErrorCode.NotFoundError,
					null,
					{ repositoryPath: this._repoPath.value, what: branchName },
					"branch",
				);
			return branch;
		});
	}

	async getRemoteBranchName(name: string, data?: GitSourceData): Promise<string> {
		return await this._logWrapper("getRemoteBranchName", `Getting remote branch name for ${name}`, async () => {
			try {
				return await this._impl.getRemoteBranchName(name, data);
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value, branchName: name });
			}
		});
	}

	async getCommitHash(ref = "HEAD"): Promise<GitVersion> {
		return await this._logWrapper("getCommitHash", `Getting commit hash for ${ref}`, async () => {
			try {
				return await this._impl.getCommitHash(ref);
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value });
			}
		});
	}

	async getHeadCommit(ref: GitBranch | string = "HEAD"): Promise<GitVersion> {
		return await this._logWrapper("getHeadCommit", `Getting head commit for ref:${ref.toString()}`, async () => {
			try {
				return this._impl.getHeadCommit(ref.toString());
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value, branchName: ref.toString() });
			}
		});
	}

	async createNewBranch(newBranchName: string) {
		await this._logWrapper("createNewBranch", `Creatig new branch '${newBranchName}'`, async () => {
			try {
				await this._impl.newBranch(newBranchName);
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value, branchName: newBranchName }, "branch");
			}
		});
	}

	async deleteBranch(branchName: GitBranch | string, remote?: boolean, data?: GitSourceData): Promise<void> {
		await this._logWrapper(
			"deleteBranch",
			`Deleteing ${remote ? "remote " : ""}branch '${branchName}'`,
			async () => {
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
			},
		);
	}

	async getCommitAuthors(): Promise<CommitAuthorInfo[]> {
		return await this._logWrapper("getCommitAuthors", "Getting commit authors", () =>
			this._impl.getCommitAuthors(),
		);
	}

	async setHead(refname: string) {
		return await this._logWrapper("setHead", `Setting head to ${refname}`, async () => {
			try {
				return await this._impl.setHead(refname);
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value });
			}
		});
	}

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

		await this._logWrapper("checkout", `Checkout to ref '${ref.toString()}'`, async () => {
			try {
				await this._impl.checkout(data, ref.toString(), force);
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value }, caller ?? "checkout");
			}
		});
	}

	async clone(url: string, source: GitSourceData, cancelToken: CancelToken, opts: CloneOptions = {}): Promise<void> {
		url = url.endsWith(".git") ? url : url + ".git";

		return await this._logWrapper("clone", `Cloning url: '${url}', path: '${this._repoPath}'`, async () => {
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
					url,
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
					{ repositoryPath: this._repoPath.value, remoteUrl: url, branchName: opts.branch },
					"clone",
					null,
					t("git.clone.error.cannot-clone"),
				);
			}
		});
	}

	async recover(
		data: GitSourceData,
		cancelToken: CancelToken,
		onProgress: (progress: RemoteProgress) => void,
	): Promise<void> {
		return await this._impl.recover(data, cancelToken, onProgress);
	}

	async cancel(cancelToken: CancelToken): Promise<boolean> {
		return await this._impl.cancel(cancelToken);
	}

	async getAllCancelTokens(): Promise<number[]> {
		try {
			return this._impl.getAllCancelTokens();
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	async add(filePaths?: Path[], force = false): Promise<void> {
		return this._logWrapper(
			"add",
			`Adding ${filePaths ? `filePaths: '${filePaths.map((p) => p.value)}'` : "*"}`,
			async () => {
				try {
					return await this._impl.add(filePaths, force);
				} catch (e) {
					throw getGitError(e, { repositoryPath: this._repoPath.value });
				}
			},
		);
	}

	async pullLfsObjects(
		data: GitSourceData,
		paths: Path[],
		checkout: boolean,
		cancelToken: CancelToken,
	): Promise<void> {
		return await this._logWrapper("pullLfsObjects", "Pulling LFS objects", async () => {
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
		});
	}

	async reset(opts: ResetOptions): Promise<void> {
		try {
			return await this._impl.reset(opts);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	async stash(data: SourceData): Promise<GitStash> {
		return await this._logWrapper("stash", "Stashing", async () => {
			const res = await this._impl.stash(data);
			const stash = res && new GitStash(res);
			if (stash) this._log(`Stashed oid '${stash.toString()}'`, "stash");
			return stash;
		});
	}

	async applyStash(stashOid: GitStash): Promise<MergeResult> {
		const res = await this._logWrapper("applyStash", `Applying stash oid: '${stashOid.toString()}'`, () =>
			this._impl.applyStash(stashOid.toString()),
		);
		return fixConflictLibgit2(res, this._fp, this._repoPath, this, await this.getHeadCommit(), stashOid);
	}

	async deleteStash(stashHash: GitStash): Promise<void> {
		return await this._logWrapper("deleteStash", `Deleting stash stashOid: '${stashHash.toString()}'`, async () => {
			try {
				return await this._impl.deleteStash(stashHash.toString());
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value });
			}
		});
	}

	async stashParent(stashOid: GitStash): Promise<GitVersion> {
		return await this._logWrapper(
			"stashParent",
			`Getting stash parent stashOid: ${stashOid.toString()}`,
			async () => {
				try {
					return await this._impl.stashParent(stashOid.toString());
				} catch (e) {
					throw getGitError(e, { repositoryPath: this._repoPath.value });
				}
			},
		);
	}

	async pull(data: GitSourceData) {
		return await this._logWrapper("pull", "Pulling", async () => {
			try {
				await this.fetch(data);
				const remoteBranchName = (await this.getCurrentBranch()).getData().remoteName?.replace("origin/", "");
				if (!remoteBranchName) return;

				const remoteWithRemoteBranchName = (await this.getRemoteName()) + "/" + remoteBranchName;

				await this.merge(data, { theirs: remoteWithRemoteBranchName });
			} catch (e) {
				throw e.props ? e : getGitError(e, { repositoryPath: this._repoPath.value }, "pull");
			}
		});
	}

	async push(data: GitSourceData): Promise<void> {
		return await this._logWrapper("push", "Pushing", async () => {
			try {
				await this._impl.push(data);
			} catch (e) {
				const origin = await this.getRemoteUrl();
				throw getGitError(e, { repositoryPath: this._repoPath.value, remoteUrl: origin }, "push");
			}
		});
	}

	async fetch(data: GitSourceData, force = false, lock = true): Promise<void> {
		return await this._logWrapper("fetch", "Fetching", async () => {
			try {
				await this._impl.fetch(data, force, lock);
				await this._events.emit("fetch", { commands: this, force });
			} catch (e) {
				const origin = await this.getRemoteUrl();
				throw getGitError(e, { repositoryPath: this._repoPath.value, remoteUrl: origin }, "fetch");
			}
		});
	}

	async merge(data: GitSourceData, opts: MergeOptions): Promise<MergeResult> {
		assert(opts, "merge opts is required");
		assert(opts.theirs, "opts.theirs is required");

		const head = await this.getCurrentBranch();
		const res = await this._logWrapper(
			"merge",
			`Merging branch '${opts.theirs}' into current branch: '${head.toString()}'`,
			async () => {
				const mergeResult = await this._impl.merge(data, opts);
				if (!mergeResult.length) await this.checkout(data, head, { force: true });
				return mergeResult;
			},
		);

		return fixConflictLibgit2(
			res,
			this._fp,
			this._repoPath,
			this,
			await this.getHeadCommit(),
			await this.getHeadCommit(opts.theirs),
		);
	}

	async formatMergeMessage(data: SourceData, opts: MergeOptions): Promise<string> {
		assert(opts, "merge opts is required");
		assert(opts.theirs, "opts.theirs is required");
		return await this._impl.formatMergeMessage(data, opts);
	}

	async commit(
		message: string,
		data: SourceData,
		parents?: (string | GitBranch)[],
		files?: Path[],
	): Promise<GitVersion> {
		return await this._logWrapper("commit", "Commiting", async () => {
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
		});
	}

	async status(type: "index" | "workdir" = "workdir"): Promise<GitStatus[]> {
		return await this._logWrapper("status", `Getting status, type: ${type}`, async () => {
			try {
				return await this._impl.status(type);
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value });
			}
		});
	}

	async fileStatus(filePath: Path): Promise<GitStatus> {
		return this._logWrapper("status file", `Getting file status ${filePath.value}`, async () => {
			try {
				return await this._impl.fileStatus(filePath);
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value });
			}
		});
	}

	/**
	 * @deprecated use GitTreeFileProvider instead
	 */
	async showFileContent(filePath: Path, ref?: GitVersion | GitStash): Promise<string> {
		return await this._logWrapper(
			"showFileContent",
			`Getting file content for filePath: '${filePath}'`,
			async () => {
				try {
					return await this._impl.showFileContent(filePath, ref);
				} catch (e) {
					throw getGitError(e, { repositoryPath: this._repoPath.value });
				}
			},
		);
	}

	async getFileHistory(filePath: Path, count = 15): Promise<VersionControlInfo[]> {
		return await this._logWrapper(
			"getFileHistory",
			`Getting file history for file: '${filePath.value}'`,
			async () => {
				try {
					return await this._impl.getFileHistory(filePath, count);
				} catch (e) {
					throw getGitError(e, { repositoryPath: this._repoPath.value });
				}
			},
		);
	}

	async getRemoteUrl(): Promise<string> {
		return await this._logWrapper("getRemoteUrl", "Getting remote url", async () => {
			try {
				return await this._impl.getRemoteUrl();
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value });
			}
		});
	}

	async getParentCommit(commitOid: GitVersion): Promise<GitVersion> {
		return await this._logWrapper(
			"getParentCommit",
			`Getting parent commit for commitOid: '${commitOid.toString()}'`,
			async () => {
				try {
					const oid = await this._impl.getParentCommit(commitOid.toString());
					return new GitVersion(oid);
				} catch (e) {
					throw getGitError(e, { repositoryPath: this._repoPath.value });
				}
			},
		);
	}

	countChangedFiles(searchIn: string): Promise<UpstreamCountFileChanges> {
		try {
			return this._impl.countChangedFiles(searchIn);
		} catch (e) {
			return Promise.resolve({ pull: 0, push: 0, changed: 0, hasChanges: false });
		}
	}

	async restore(staged: boolean, filePaths: Path[]): Promise<void> {
		return await this._logWrapper(
			"restore",
			`Restore filePaths: '${filePaths.map((p) => p.value)}' staged:${staged}`,
			async () => {
				try {
					return await this._impl.restore(staged, filePaths);
				} catch (e) {
					throw getGitError(e, { repositoryPath: this._repoPath.value });
				}
			},
		);
	}

	async diff(opts: DiffConfig): Promise<DiffTree2TreeInfo> {
		return await this._logWrapper("diff", `Finding diffs for opts: '${JSON.stringify(opts)}'`, async () => {
			try {
				return await this._impl.diff(opts);
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value });
			}
		});
	}

	async haveConflictsWithBranch(branch: GitBranch | string, data: GitSourceData): Promise<boolean> {
		return await this._logWrapper(
			"haveConflicts",
			`Checking if there are conflicts for ref: '${branch.toString()}'`,
			async () => {
				// temp implementation
				const before = await this.getHeadCommit();
				const isBrowser = getExecutingEnvironment() === "browser";
				if (!isBrowser) await this.add();

				assert((await this.status("index")).length == 0, "Can't check conflicts if there are local changes");

				const haveConflicts = (await this.merge(data, { theirs: branch.toString() })).length > 0;
				await this.reset({ mode: "hard", head: before });
				return haveConflicts;
			},
		);
	}

	async getCommitInfo(oid: GitVersion, opts: { depth: number; simplify: boolean }): Promise<GitVersionData[]> {
		return await this._logWrapper(
			"getCommitInfo",
			`Getting commit info for oid: '${oid.toString()}', depth: ${opts.depth}, simplify: ${opts.simplify}`,
			async () => {
				try {
					return await this._impl.getCommitInfo(oid.toString(), opts);
				} catch (e) {
					throw getGitError(e, { repositoryPath: this._repoPath.value });
				}
			},
		);
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
		const name = this.repoPath.nameWithExtension;
		const root = path.rootDirectory?.value || "";
		if (!(root.startsWith(name) && (!root[name.length] || root[name.length] === ":")))
			return path.value[0] === "/" ? new Path(path.value.substring(1)) : path;

		const parts = path.value.split("/").filter(Boolean);
		if (parts.length > 0) parts.shift();
		path = new Path(parts.join("/"));

		return path;
	}

	private _log(msg: string, command: string, error?: Error) {
		if (error) PersistentLogger.err(msg, error, "git", { command, repo: this._repoPath.value });
		else PersistentLogger.info(msg, "git", { command, repo: this._repoPath.value });
	}

	private async _logWrapper<T>(command: string, msg: string, func: () => T | Promise<T>): Promise<T> {
		this._log(msg, command);
		try {
			return await func();
		} catch (e) {
			this._log(`${msg} failed`, command, e);
			throw e;
		}
	}
}

export default GitCommands;
