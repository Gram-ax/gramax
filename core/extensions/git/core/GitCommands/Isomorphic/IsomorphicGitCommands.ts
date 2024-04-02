import { getHttpsRepositoryUrl } from "@components/libs/utils";
import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import isomorphicDiff from "@ext/git/core/GitCommands/Isomorphic/utils/isomorphicDiff";
import GitCommandsConfig from "@ext/git/core/GitCommands/model/GitCommandsConfig";
import ini from "ini";
import git, {
	GetRemoteInfoResult,
	MergeResult,
	PromiseFsClient,
	ReadBlobResult,
	ReadCommitResult,
	ReadTreeResult,
} from "isomorphic-git";
import http from "isomorphic-git/http/web";
import { VersionControlInfo } from "../../../../VersionControl/model/VersionControlInfo";
import { FileStatus } from "../../../../Watchers/model/FileStatus";
import SourceData from "../../../../storage/logic/SourceDataProvider/model/SourceData";
import { GitBranch } from "../../GitBranch/GitBranch";
import gitDataParser from "../../GitDataParser/GitDataParser";
import { GitStatus } from "../../GitWatcher/model/GitStatus";
import { GitOid } from "../../model/GitOid";
import GitProgressEvent from "../../model/GitProgressEvent";
import GitSourceData from "../../model/GitSourceData.schema";
import { GitVersion } from "../../model/GitVersion";
import SubmoduleData from "../../model/SubmoduleData";
import GitCommands from "../GitCommands";
import GitError from "../errors/GitError";
import getGitError from "../errors/logic/getGitError";
import GitErrorCode from "../errors/model/GitErrorCode";
import GitCommandsModel from "../model/GitCommandsModel";
import IsomorphicFileProvider from "./IsomorphicFileProvider";

class IsomorphicGitCommands implements GitCommandsModel {
	private _gitFs: PromiseFsClient;
	private _proxy: string;
	private static _cache = {};

	constructor(
		private _repoPath: Path,
		private _fp: FileProvider,
		private _parent: GitCommands,
		private _conf: GitCommandsConfig,
	) {
		this._gitFs = { promises: new IsomorphicFileProvider(this._fp) };
		this._proxy = this._conf.corsProxy;
	}

	async init(data: SourceData): Promise<void> {
		await git.init({ fs: this._gitFs, dir: this._repoPath.value });
		await this.add();
		await this.commit("init", data);
		await this._fp.write(
			this._repoPath.join(new Path(`/.git/config`)),
			`[core]
      repositoryformatversion = 0
      filemode = true
      bare = false
      logallrefupdates = true
      ignorecase = true
      precomposeunicode = true
      `,
		);
	}

	async clone(
		url: string,
		source: GitSourceData,
		branch?: string,
		onProgress?: (progress: GitProgressEvent) => void,
	) {
		await git.clone({
			url,
			http,
			fs: this._gitFs,
			dir: this._repoPath.value,
			ref: branch,
			corsProxy: this._proxy,
			onAuth: this._onAuth(source),
			onProgress: onProgress,
		});
	}

	async push(data: GitSourceData): Promise<void> {
		await git.push({
			fs: this._gitFs,
			http,
			dir: this._repoPath.value,
			onAuth: this._onAuth(data),
			url: getHttpsRepositoryUrl(await this._getRemoteUrl()),
			cache: IsomorphicGitCommands._cache,
			corsProxy: this._proxy,
		});
	}

	async fetch(data: GitSourceData): Promise<void> {
		await git.fetch({
			fs: this._gitFs,
			http,
			prune: true,
			dir: this._repoPath.value,
			onAuth: this._onAuth(data),
			url: getHttpsRepositoryUrl(await this._getRemoteUrl()),
			cache: IsomorphicGitCommands._cache,
			corsProxy: this._proxy,
		});
	}

	async checkout(ref: string, force?: boolean): Promise<void> {
		return await git.checkout({
			fs: this._gitFs,
			dir: this._repoPath.value,
			ref,
			force,
		});
	}

	async merge(data: GitSourceData, theirs: string, abortOnConflict?: boolean): Promise<void> {
		const currentBranch = await this._parent.getCurrentBranch();
		const correctStatus = await this.diff(currentBranch.toString(), theirs);

		let res: MergeResult;
		try {
			res = await git.merge({
				fs: this._gitFs,
				dir: this._repoPath.value,
				theirs,
				author: this._getAuthor(data),
				abortOnConflict,
			});
		} finally {
			await this._resetExtraFiles(correctStatus);
		}

		if (!res?.oid)
			throw new GitError(
				GitErrorCode.MergeError,
				null,
				{ repositoryPath: this._repoPath.value, theirs },
				"merge",
			);
	}

	async add(paths?: Path[]): Promise<void> {
		if (!paths) return git.add({ fs: this._gitFs, dir: this._repoPath.value, filepath: "." });

		await Promise.all(
			paths.map(async (filePath) => {
				try {
					await git.add({ fs: this._gitFs, dir: this._repoPath.value, filepath: filePath.value });
				} catch (addError) {
					try {
						await git.remove({
							fs: this._gitFs,
							dir: this._repoPath.value,
							filepath: filePath.value,
							// cache: GitRepository._cache,
						});
					} catch (_removeError) {
						throw getGitError(addError, { repositoryPath: this._repoPath.value });
					}
				}
			}),
		);
	}

	async status(): Promise<GitStatus[]> {
		const status = await git.statusMatrix({
			fs: this._gitFs,
			dir: this._repoPath.value,
			cache: IsomorphicGitCommands._cache,
		});
		const submodulePaths = (await this._getSubmodulesData()).map((x) => x.path);
		return gitDataParser.getStatusChanges(status, submodulePaths);
	}

	async fileStatus(filePath: Path): Promise<GitStatus> {
		const status = await git.status({
			fs: this._gitFs,
			dir: this._repoPath.value,
			cache: IsomorphicGitCommands._cache,
			filepath: filePath.value,
		});
		return gitDataParser.getFileStatus(status, filePath);
	}

	diff(branchA: string, branchB: string): Promise<GitStatus[]> {
		return isomorphicDiff(branchA, branchB, this._gitFs, this._repoPath.value);
	}

	async getCurrentBranch(data?: GitSourceData): Promise<GitBranch> {
		let branchName: string;
		branchName = await this.getCurrentBranchName();
		if (!branchName)
			throw new GitError(GitErrorCode.CurrentBranchNotFoundError, null, {
				repositoryPath: this._repoPath.value,
			});
		branchName = branchName.trim();
		const info = await this._getLastCommitInfo(branchName);
		return new GitBranch({
			name: branchName,
			lastCommitAuthor: info.name,
			lastCommitModify: new Date(info.timestamp * 1000).toString(),
			remoteName: await this._getRemoteBranchName(branchName, data),
		});
	}

	async getCurrentBranchName() {
		const branchName = await git.currentBranch({ fs: this._gitFs, dir: this._repoPath.value });
		if (!branchName)
			throw new GitError(GitErrorCode.CurrentBranchNotFoundError, null, {
				repositoryPath: this._repoPath.value,
			});
		return branchName;
	}

	async getAllBranches(): Promise<GitBranch[]> {
		const localBranches = await this._getLocalBranches();
		const remoteBranches = (await this._getRemoteBranches()).filter((b) => b != "HEAD");
		const allBranches = Array.from(new Set([...remoteBranches, ...localBranches]));
		const branchesWithDifferentRemote: string[] = [];

		return await Promise.all(
			allBranches.map(async (branchName): Promise<GitBranch> => {
				const info = await this._getLastCommitInfo(branchName);
				const remoteName = await this._getRemoteBranchName(branchName);
				if (remoteName !== branchName) branchesWithDifferentRemote.push(remoteName);
				return new GitBranch({
					name: branchName,
					lastCommitAuthor: info.name,
					lastCommitModify: new Date(info.timestamp * 1000).toString(),
					remoteName,
				});
			}),
		);
	}

	async getBranch(name: string): Promise<GitBranch> {
		const branches = await this.getAllBranches();
		return branches.find(
			(b) => name === b.toString() || (b.getData().remoteName && name === b.getData().remoteName),
		);
	}

	async getCommitHash(ref: GitBranch | GitVersion | string = "HEAD"): Promise<GitVersion> {
		try {
			const hash = await git.resolveRef({
				fs: this._gitFs,
				dir: this._repoPath.value,
				ref: ref.toString(),
			});
			return new GitVersion(hash);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value, branchName: ref.toString() }, "resolveRef");
		}
	}

	async getFileHistory(filePath: Path, count: number): Promise<VersionControlInfo[]> {
		let commits: ReadCommitResult[] = [];
		try {
			commits = await git.log({
				fs: this._gitFs,
				dir: this._repoPath.value,
				filepath: filePath.value,
				// follow: true,
				cache: IsomorphicGitCommands._cache,
			});
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}

		if (commits.length > 1) commits = await this._removeExtraCommitsInLog(commits, filePath);
		if (commits.length > count) commits = commits.slice(0, count);

		return Promise.all(
			commits.map(async (commit): Promise<VersionControlInfo> => {
				const parentVersion = commit.commit.parent[0];
				let parentContent = "";
				try {
					if (parentVersion)
						parentContent = await this.showFileContent(filePath, new GitVersion(parentVersion));
				} catch {
					//
				}
				return {
					version: commit.oid,
					author: commit.commit.author.name,
					date: new Date(commit.commit.author.timestamp * 1000).toJSON(),
					content: await this.showFileContent(filePath, new GitVersion(commit.oid)),
					parentContent,
				};
			}),
		);
	}

	async deleteBranch(name: string, remote?: boolean, data?: GitSourceData): Promise<void> {
		if (remote) {
			await git.push({
				fs: this._gitFs,
				dir: this._repoPath.value,
				http,
				onAuth: this._onAuth(data),
				url: getHttpsRepositoryUrl(await this._getRemoteUrl()),
				corsProxy: this._proxy,
				ref: name,
				delete: true,
				remoteRef: name,
			});
		} else {
			await git.deleteBranch({
				fs: this._gitFs,
				dir: this._repoPath.value,
				ref: name,
			});
		}
	}

	async newBranch(name: string): Promise<void> {
		const currentBranch = await this.getCurrentBranch();
		const commitHash = await this.getCommitHash(currentBranch);
		await git.branch({
			fs: this._gitFs,
			dir: this._repoPath.value,
			ref: name,
			checkout: true,
			object: commitHash.toString(),
		});
	}

	async getHeadCommit(branch: string): Promise<GitVersion> {
		const hash = await git.resolveRef({
			fs: this._gitFs,
			dir: this._repoPath.value,
			ref: branch,
		});
		return new GitVersion(hash);
	}

	async commit(message: string, data: SourceData, parents?: string[]): Promise<GitVersion> {
		const hash = await git.commit({
			fs: this._gitFs,
			dir: this._repoPath.value,
			message,
			author: this._getAuthor(data),
			parent: parents,
			// cache: GitRepository._cache,
		});
		return new GitVersion(hash);
	}

	async addRemote(url: string) {
		await git.addRemote({
			fs: this._gitFs,
			dir: this._repoPath.value,
			remote: "origin",
			url,
		});
	}

	async resetHard(): Promise<void> {
		const currentBranch = await this.getCurrentBranch();
		await this.checkout(currentBranch.toString(), true);
		const status = await this.status();
		await Promise.all(
			status.map(async (s) => {
				if (s.type === FileStatus.new) await this._fp.delete(this._repoPath.join(s.path));
			}),
		);
	}

	async restore(staged: boolean, filePaths: Path[]): Promise<void> {
		if (staged) {
			await Promise.all(
				filePaths.map(async (filePath) => {
					await git.resetIndex({
						fs: this._gitFs,
						dir: this._repoPath.value,
						filepath: filePath.value,
						cache: IsomorphicGitCommands._cache,
					});
				}),
			);
		} else {
			await Promise.all(
				filePaths.map(async (filePath) => {
					const fullFilePath = this._repoPath.join(filePath);
					try {
						const headFileContent = await this._showFileBlobContent(filePath);
						await this._fp.write(fullFilePath, Buffer.from(headFileContent));
					} catch {
						await this._fp.delete(fullFilePath);
					}
				}),
			);
		}
	}

	async resetSoft(head?: GitVersion): Promise<void> {
		const currentHash = await this.getHeadCommit("HEAD");
		const currentBranch = await this.getCurrentBranch();
		const newHead = head ?? (await this.commitParent(currentHash));
		const headPath = this._repoPath.join(new Path(`.git/refs/heads/${currentBranch}`));
		await this._fp.write(headPath, newHead.toString());
	}

	async commitParent(hash: GitVersion): Promise<GitVersion> {
		const parentHash = (
			await git.readCommit({
				fs: this._gitFs,
				dir: this._repoPath.value,
				oid: hash.toString(),
				cache: IsomorphicGitCommands._cache,
			})
		).commit.parent[0];
		return new GitVersion(parentHash);
	}

	async showFileContent(filePath: Path, hash = new GitVersion("")): Promise<string> {
		return new TextDecoder().decode(await this._showFileBlobContent(filePath, hash));
	}

	async getFixedSubmodulePaths(): Promise<Path[]> {
		const submodulesData = await this.getSubmodulesData();
		return Promise.all(
			submodulesData.map(async (submoduleData): Promise<Path> => {
				if (!submoduleData.path?.value) return;

				const submodulePath = this._repoPath.join(submoduleData.path);
				const subGitRepository = new GitCommands(this._conf, this._fp, submodulePath);
				const dotGitFile = submodulePath.join(new Path(".git"));

				if (!(await this._fp.exists(dotGitFile))) return;

				if (!(await this._fp.isFolder(dotGitFile))) {
					await this._changeDotGitFileToDir(this._repoPath, submoduleData.path, dotGitFile);
				}

				await (subGitRepository.inner() as this).fixWorktreeConfig();
				try {
					await subGitRepository.getCurrentBranch();
				} catch {
					await this._checkoutSubmodule(subGitRepository, submoduleData.branch);
				}
				return submodulePath;
			}),
		).then((x) => x.filter((x) => x));
	}

	async getSubmodulesData(): Promise<SubmoduleData[]> {
		const gitmodules = await this._fp.read(this._repoPath.join(new Path(".gitmodules")));
		if (!gitmodules) return [];
		const res: SubmoduleData[] = [];
		const data = ini.parse(gitmodules);
		for (const v of Object.values(data) as any) {
			if (!v.path) continue;
			res.push({
				path: new Path(v.path),
				url: v.url,
				branch: v?.branch,
			});
		}
		return res;
	}

	async getParentCommit(commitOid: string): Promise<string> {
		return (
			await git.readCommit({
				fs: this._gitFs,
				dir: this._repoPath.value,
				oid: commitOid,
				cache: IsomorphicGitCommands._cache,
			})
		).commit.parent[0];
	}

	async getRemoteUrl(): Promise<string> {
		try {
			return await git.getConfig({
				fs: this._gitFs,
				dir: this._repoPath.value,
				path: `remote.${await this.getRemoteName()}.url`,
			});
		} catch {
			throw new Error(
				`В репозитории '${this._repoPath.value}' не удалось получить ссылку на удалённый репозиторий`,
			);
		}
	}

	async getRemoteBranchName(name: string, data?: GitSourceData): Promise<string> {
		const remoteBranches = data
			? Object.keys((await this._getRemoteInfo(data)).refs.heads)
			: await this._getRemoteBranches();
		if (remoteBranches.includes(name)) return name;
		try {
			const remoteBranch: string = (
				await git.getConfig({
					fs: this._gitFs,
					dir: this._repoPath.value,
					path: `branch.${name}.merge`,
				})
			).replace(`refs/heads/`, "");
			if (!remoteBranches.includes(remoteBranch)) return null;
			return remoteBranch;
		} catch (e) {
			return null;
		}
	}

	async stash(data: GitSourceData): Promise<string> {
		const currentBranch = await this._parent.getCurrentBranch();
		const stashHash = `stash_from_${currentBranch}_${new Date().getTime()}`;
		await this._parent.createNewBranch(stashHash);
		const status = await this._parent.status();
		await this._parent.add(status.map((x) => x.path));
		await this._parent.commit("init_stash", data);
		await this._parent.checkout(currentBranch);
		return stashHash;
	}

	async applyStash(data: GitSourceData, stashOid: string): Promise<void> {
		await this._parent.merge(data, stashOid, false);

		await this._parent.deleteBranch(stashOid);
		await this._parent.softReset();
		const changes = await this._parent.status();
		await this._parent.restore(
			true,
			changes.map((c) => c.path),
		);
	}

	async stashParent(stashOid: string): Promise<GitVersion> {
		const commitHash = await this._parent.getHeadCommit(stashOid);
		const oid = await this._parent.getParentCommit(commitHash);
		return oid;
	}

	deleteStash(stashOid: string): Promise<void> {
		return this._parent.deleteBranch(stashOid, false);
	}

	fixWorktreeConfig(): Promise<void> {
		try {
			return git.setConfig({
				fs: this._gitFs,
				dir: this._repoPath.value,
				path: "core.worktree",
				value: undefined,
			});
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath.value });
		}
	}

	async rawStatus() {
		return git
			.statusMatrix({
				fs: this._gitFs,
				dir: this._repoPath.value,
				cache: IsomorphicGitCommands._cache,
			})
			.then((x) =>
				x
					.map((x) => ({
						path: x[0],
						status: "" + x[1] + x[2] + x[3],
					}))
					.filter((x) => x.status !== "111"),
			);
	}

	getRemoteName(): Promise<string> {
		const REMOTE = "origin";
		return Promise.resolve(REMOTE);
	}

	private async _resetExtraFiles(correctStatus: GitStatus[]): Promise<void> {
		const currentStatus = await this._parent.status();
		const paths = currentStatus
			.filter((status) => !correctStatus.map((x) => x.path.value).includes(status.path.value))
			.map((status) => status.path);

		await this._parent.restore(false, paths);
	}

	private async _showFileBlobContent(filePath: Path, hash = new GitVersion("")): Promise<Uint8Array> {
		const commitOid = hash.toString() ? hash : await this.getHeadCommit("HEAD");
		let fileContent: ReadBlobResult;
		try {
			fileContent = await git.readBlob({
				fs: this._gitFs,
				dir: this._repoPath.value,
				oid: commitOid.toString(),
				filepath: filePath.removeExtraSymbols.value,
			});
		} catch (e) {
			throw getGitError(
				e,
				{ repositoryPath: this._repoPath.value, hash: hash.toString(), filePath: filePath.value },
				"readBlob",
			);
		}

		return fileContent.blob;
	}

	private _getLocalBranches(): Promise<string[]> {
		return git.listBranches({ fs: this._gitFs, dir: this._repoPath.value });
	}

	private async _getSubmodulesData(): Promise<SubmoduleData[]> {
		const gitmodules = await this._fp.read(this._repoPath.join(new Path(".gitmodules")));
		if (!gitmodules) return [];
		const res: SubmoduleData[] = [];
		const data = ini.parse(gitmodules);
		for (const v of Object.values(data) as any) {
			if (!v.path) continue;
			res.push({
				path: new Path(v.path),
				url: v.url,
				branch: v?.branch,
			});
		}
		return res;
	}

	private async _getLastCommitInfo(branchName: string) {
		let commitHash: GitVersion;
		const remote = await this.getRemoteName();
		try {
			commitHash = await this.getCommitHash(branchName);
		} catch {
			try {
				commitHash = await this.getCommitHash(`refs/remotes/${remote}/${branchName}`);
			} catch (e) {
				throw getGitError(e, { repositoryPath: this._repoPath.value });
			}
		}

		const commitInfo = await git.readCommit({
			fs: this._gitFs,
			dir: this._repoPath.value,
			oid: commitHash.toString(),
			cache: IsomorphicGitCommands._cache,
		});

		return commitInfo.commit.author;
	}

	private async _getRemoteInfo(data: GitSourceData): Promise<GetRemoteInfoResult> {
		return git.getRemoteInfo({
			http,
			corsProxy: this._proxy,
			onAuth: this._onAuth(data),
			url: getHttpsRepositoryUrl(await this._getRemoteUrl()),
		});
	}

	private async _getRemoteUrl(): Promise<string> {
		try {
			return await git.getConfig({
				fs: this._gitFs,
				dir: this._repoPath.value,
				path: `remote.${await this.getRemoteName()}.url`,
			});
		} catch {
			// should be catching fp error here
			throw new Error(
				`В репозитории '${this._repoPath.value}' не удалось получить ссылку на удалённый репозиторий`,
			);
		}
	}

	private async _getRemoteBranchName(name: string, data?: GitSourceData): Promise<string> {
		const remoteBranches = data
			? Object.keys((await this._getRemoteInfo(data)).refs.heads)
			: await this._getRemoteBranches();
		if (remoteBranches.includes(name)) return name;
		try {
			const remoteBranch: string = (
				await git.getConfig({
					fs: this._gitFs,
					dir: this._repoPath.value,
					path: `branch.${name}.merge`,
				})
			).replace(`refs/heads/`, "");
			if (!remoteBranches.includes(remoteBranch)) return null;
			return remoteBranch;
		} catch (e) {
			return null;
		}
	}

	private async _getRemoteBranches(): Promise<string[]> {
		const remote = await this.getRemoteName();
		return git.listBranches({ fs: this._gitFs, dir: this._repoPath.value, remote });
	}

	private _getAuthor = (data: SourceData) => ({ name: data.userName, email: data.userEmail });
	private _onAuth = (data: GitSourceData) => () => ({ username: data.userName, password: data.token });

	private _removeExtraCommitsInLog(commits: ReadCommitResult[], filepath: Path): Promise<ReadCommitResult[]> {
		const isMergeCommit = (commit: ReadCommitResult) => commit.commit.parent.length == 2;
		const isFirstCommit = (commit: ReadCommitResult) => commit.commit.parent.length == 0;

		return Promise.all(
			commits.map(async (commit): Promise<ReadCommitResult> => {
				if (isMergeCommit(commit)) return;
				if (isFirstCommit(commit)) return commit;

				const filePathOid = await this._getFileOidInCommit(new GitOid(commit.oid), filepath);
				const parentFilePathOid = await this._getFileOidInCommit(new GitOid(commit.commit.parent[0]), filepath);
				if (!filePathOid.compare(parentFilePathOid)) return commit;
			}),
		).then((x) => x.filter((x) => x));
	}

	private _getFileOidInCommit = async (oid: GitOid | GitVersion, filePath: Path): Promise<GitOid | null> => {
		let treeObject: ReadTreeResult;
		const rootDirectory = filePath.rootDirectory;
		const hasFileRootDirectory = !filePath.compare(rootDirectory);
		try {
			treeObject = await git.readTree({
				fs: this._gitFs,
				dir: this._repoPath.value,
				oid: oid.toString(),
				filepath: hasFileRootDirectory ? rootDirectory.value : undefined,
				cache: IsomorphicGitCommands._cache,
			});
		} catch {
			return null;
		}
		const childPath = hasFileRootDirectory ? rootDirectory.subDirectory(filePath).removeExtraSymbols : filePath;
		if (childPath.value.split("/").length == 1) {
			for (const children of treeObject.tree) {
				if (children.path == childPath.value) return new GitOid(children.oid);
			}
			return null;
		}
		return this._getFileOidInCommit(new GitOid(treeObject.oid), childPath);
	};

	private async _changeDotGitFileToDir(parentRepoPath: Path, submoduleRelativePath: Path, dotGitFilePath: Path) {
		const dotGitDir = parentRepoPath.join(new Path(".git/modules")).join(submoduleRelativePath);

		await this._fp.delete(dotGitFilePath);
		await this._fp.move(dotGitDir, dotGitFilePath);
	}

	private async _checkoutSubmodule(subGitRepository: GitCommands, branch: string) {
		try {
			if (branch) {
				await subGitRepository.checkout(branch);
				return;
			}
			await subGitRepository.checkout("master");
		} catch {
			try {
				await subGitRepository.checkout("main");
			} catch {
				return;
			}
		}
	}
}

export default IsomorphicGitCommands;
