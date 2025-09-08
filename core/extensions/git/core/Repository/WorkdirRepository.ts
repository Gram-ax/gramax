import { getExecutingEnvironment } from "@app/resolveModule/env";
import { UnsubscribeToken } from "@core/Event/EventEmitter";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import haveInternetAccess from "@core/utils/haveInternetAccess";
import GitMergeResult from "@ext/git/actions/MergeConflictHandler/model/GitMergeResult";
import { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import GitError from "@ext/git/core/GitCommands/errors/GitError";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import type { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import Repository, {
	type CheckoutOptions,
	type IsShouldSyncOptions,
	type MergeOptions,
	type PublishOptions,
	type SyncOptions,
	type SyncResult,
} from "@ext/git/core/Repository/Repository";
import RepositoryStateProvider, {
	type RepositoryCheckoutState,
	type RepositoryMergeConflictState,
	type RepositoryStashConflictState,
} from "@ext/git/core/Repository/state/RepositoryState";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import { GitVersion } from "@ext/git/core/model/GitVersion";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Storage from "@ext/storage/logic/Storage";

export default class WorkdirRepository extends Repository {
	private _getRepositoryStateFirstly = true;
	private _state: RepositoryStateProvider;
	private _unsubscribeTokens: UnsubscribeToken[] = [];

	constructor(
		repoPath: Path,
		fp: FileProvider,
		gvc: GitVersionControl,
		storage: Storage,
		disableMergeRequests?: boolean,
	) {
		super(repoPath, fp, gvc, storage, disableMergeRequests);
		this._state = new RepositoryStateProvider(this, this._repoPath, this._fp);
		if (gvc) this.subscribeEvents(fp);
	}

	subscribeEvents(fp: FileProvider) {
		if (!(fp instanceof MountFileProvider && fp.default() instanceof DiskFileProvider)) return;

		this._unsubscribeTokens.push(
			DiskFileProvider.events.on("write", (e) => this._gitIndexAddFiles([e.path])),
			DiskFileProvider.events.on("move", (e) => this._gitIndexAddFiles([e.from, e.to])),
			DiskFileProvider.events.on("copy", (e) => this._gitIndexAddFiles([e.from, e.to])),
			DiskFileProvider.events.on("delete", (e) => this._gitIndexAddFiles([e.path])),
		);
	}

	checkoutIfCurrentBranchNotExist(): Promise<{ hasCheckout: boolean }> {
		return Promise.resolve({ hasCheckout: false });
	}

	async publish(data: PublishOptions): Promise<void> {
		const { data: sourceData, onPush, onlyPush, restoreIfFail } = data;

		if (onlyPush !== true) {
			const { commitMessage, filesToPublish, onAdd, onCommit } = data;
			onAdd?.();
			await this.gvc.commit(commitMessage, sourceData, null, filesToPublish);
			onCommit?.();
		}

		await this.storage.updateSyncCount();
		await this._push({ data: sourceData, onPush, restoreIfFail });
		await this._events.emit("publish", { repo: this });
		this.gvc.update();
	}

	async canSync(): Promise<boolean> {
		const toPush = (await this.storage.getSyncCount()).push;
		if (toPush > 0) return false;
		const status = await this.gvc.getChanges("index");
		return !status.length;
	}

	async isShouldSync({ data, shouldFetch, onFetch, lockFetch = true }: IsShouldSyncOptions): Promise<boolean> {
		let toPull = (await this.storage.getSyncCount()).pull;
		if (toPull > 0) return true;

		if (shouldFetch) {
			await this.storage.fetch(data, false, lockFetch);
			onFetch?.();
		}

		toPull = (await this.storage.getSyncCount()).pull;
		return toPull > 0;
	}

	async status(cached = true): Promise<GitStatus[]> {
		if (!this._cachedStatus || !cached) this._cachedStatus = await this.gvc.getChanges();
		return this._cachedStatus;
	}

	async sync({ data, recursivePull, onPull, onPush }: SyncOptions): Promise<SyncResult> {
		if (recursivePull) {
			await this.gvc.checkoutSubGitVersionControls();
			const beforePullVersion = await this.gvc.getCurrentVersion();
			const subRepoBeforePullVerisons = await this._getSubmoduleCheckChangesData();

			await this._pull({ recursive: recursivePull, data, onPull });

			this.gvc.update();

			const afterPullVersion = await this.gvc.getCurrentVersion();
			const subRepoAfterPullVersions = await this._getSubmoduleCheckChangesData();
			const isVersionChanged = !beforePullVersion.compare(afterPullVersion);

			await this._events.emit("sync", {
				repo: this,
				isVersionChanged,
			});
			await this.gvc.recursiveCheckChanges(
				beforePullVersion,
				afterPullVersion,
				subRepoBeforePullVerisons,
				subRepoAfterPullVersions,
			);
			return { mergeData: [], isVersionChanged, before: beforePullVersion, after: afterPullVersion };
		}

		let toPush = (await this.storage.getSyncCount()).push;
		if (toPush > 0) {
			// TODO:
			// handle commit merge too
		}

		const beforePullVersion = await this.gvc.getCurrentVersion();
		const stashMergeResult = await this._pull({ recursive: recursivePull, data, onPull });

		this.gvc.update();
		const afterPullVersion = await this.gvc.getCurrentVersion();

		toPush = (await this.storage.getSyncCount()).push;
		if (toPush > 0) {
			await this._push({ data, onPush });
			this.gvc.update();
		}

		const afterPushVersion = await this.gvc.getCurrentVersion();
		const isVersionChanged = !beforePullVersion.compare(afterPushVersion);

		await this._events.emit("sync", { repo: this, isVersionChanged });

		await this.gvc.checkChanges(beforePullVersion, afterPullVersion);

		return { mergeData: stashMergeResult, isVersionChanged, before: beforePullVersion, after: afterPushVersion };
	}

	async checkout({
		data,
		branch,
		onCheckout,
		onPull,
		force,
		recursivePull,
	}: CheckoutOptions): Promise<GitMergeResultContent[]> {
		const oldVersion = await this.gvc.getCurrentVersion();
		const oldBranch = await this.gvc.getCurrentBranch();
		const allBranches = (await this.gvc.getAllBranches()).map((b) => b.getData().remoteName ?? b.getData().name);
		const haveInternet = haveInternetAccess();

		const state: RepositoryCheckoutState = { value: "checkout", data: { to: branch } };
		await this._state.saveState(state);

		if (haveInternet && !allBranches.includes(branch) && !data.isInvalid) await this.storage.fetch(data);
		await this.gvc.checkoutToBranch(branch, force);
		onCheckout?.(branch);

		const isBrowser = getExecutingEnvironment() === "browser";
		if (!isBrowser) await this.gvc.add();
		const changes = await this.gvc.getChanges("index");

		let mergeFiles: GitMergeResultContent[] = [];

		if (haveInternet && !data.isInvalid && !changes.length) {
			try {
				mergeFiles = await this._pull({ data, onPull, recursive: recursivePull });
			} catch (e) {
				await this.gvc.checkoutToBranch(oldBranch.toString());
				await this._state.resetState();
				throw e;
			}
		}

		this.gvc.update();
		const newVersion = await this.gvc.getCurrentVersion();

		await this._events.emit("checkout", { repo: this, branch });
		await this.gvc.checkChanges(oldVersion, newVersion);

		await this._state.resetState();
		return mergeFiles;
	}

	async validateMerge(): Promise<void> {
		if ((await this.gvc.getChanges("workdir")).length > 0)
			throw new GitError(GitErrorCode.WorkingDirNotEmpty, null, { repositoryPath: this.gvc.getPath().value });
	}

	async merge({
		data,
		targetBranch,
		deleteAfterMerge,
		squash,
		validateMerge = true,
		isMergeRequest,
	}: MergeOptions): Promise<GitMergeResultContent[]> {
		if (validateMerge) await this.validateMerge();

		const branchNameBefore = (await this.gvc.getCurrentBranch()).toString();
		await this.checkout({ data, branch: targetBranch });

		const mergeResult = await this.gvc.mergeBranch(data, {
			theirs: branchNameBefore,
			squash,
			isMergeRequest,
		});

		if (!mergeResult.length) {
			if (!data.isInvalid) await this.publish({ data, onlyPush: true, restoreIfFail: false });
			if (deleteAfterMerge) await this.deleteBranch(branchNameBefore, data);
			return [];
		}

		const state: RepositoryMergeConflictState = {
			value: "mergeConflict",
			data: {
				branchNameBefore,
				theirs: branchNameBefore,
				conflictFiles: mergeResult,
				deleteAfterMerge,
				reverseMerge: true,
				squash,
				isMergeRequest,
			},
		};
		await this._state.saveState(state);

		return this._state.mergeConflictResolver.convertToMergeResultContent(mergeResult);
	}

	async getState(): Promise<RepositoryStateProvider> {
		const repState = this._state;
		await repState.getState();
		if (!this._getRepositoryStateFirstly) return repState;

		this._getRepositoryStateFirstly = false;

		if (repState.inner.value === "checkout") {
			await this._state.resetState();
			return this._state;
		}

		return repState;
	}

	async deleteBranch(branchName: string, data: SourceData) {
		const branch = await this.gvc.getBranch(branchName);
		const branchRemoteName = branch.getData().remoteName;
		const isGit = isGitSourceType(await this.storage.getType());

		if (branchRemoteName && isGit)
			await (this.storage as GitStorage).deleteRemoteBranch(branchRemoteName, data as GitSourceData);

		await this.gvc.deleteLocalBranch(branchName);
	}

	private async _gitIndexAddFiles(p: Path[]) {
		const paths = p.filter(
			(x) =>
				x &&
				x.value.length &&
				x.startsWith(this._repoPath) &&
				x.value !== this._repoPath.value &&
				x.value !== this._repoPath.join(new Path(".git")).value,
		);

		if (paths.length === 0) return;
		const gitPaths = paths.map((x) => this._repoPath.rootDirectory.subDirectory(x));
		await this.gvc.add(gitPaths);
	}

	private async _getSubmoduleCheckChangesData(): Promise<{
		[path: string]: { version: GitVersion; subGvc: GitVersionControl };
	}> {
		const subGvcs = await this.gvc.getSubGitVersionControls();
		const versions: { [path: string]: { version: GitVersion; subGvc: GitVersionControl } } = {};
		for (const gvc of subGvcs) {
			versions[gvc.getPath().value] = { subGvc: gvc, version: await gvc.getHeadCommit() };
		}
		return versions;
	}

	private async _push({
		data,
		onPush,
		restoreIfFail = true,
	}: {
		data: SourceData;
		onPush?: () => void | Promise<void>;
		restoreIfFail?: boolean;
	}): Promise<void> {
		try {
			await this.storage.push(data);
		} catch (e) {
			if (restoreIfFail) await this.gvc.restoreRepositoryState();
			await this.storage.updateSyncCount();
			throw e;
		}
		await onPush?.();
	}

	private async _pull({
		data,
		recursive = true,
		onPull,
	}: {
		data: SourceData;
		recursive?: boolean;
		onPull?: () => void;
	}): Promise<GitMergeResultContent[]> {
		if (recursive) {
			await this.storage.pull(data, recursive);
			onPull?.();
			return [];
		}

		let stashResult: GitMergeResult[] = [];
		const commitHeadBefore = await this.gvc.getCurrentVersion();

		const stashOid = await this.stash(data);

		try {
			await this.storage.pull(data, recursive);
		} catch (e) {
			await this.gvc.reset({ mode: "hard", head: commitHeadBefore });
			if (stashOid) await this.gvc.applyStash(stashOid);
			throw e;
		}

		if (stashOid) stashResult = await this.gvc.applyStash(stashOid, { deleteAfterApply: false });

		onPull?.();

		if (!stashResult.length) {
			if (stashOid) await this.gvc.deleteStash(stashOid);
			return [];
		}

		const state: RepositoryStashConflictState = {
			value: "stashConflict",
			data: {
				commitHeadBefore: commitHeadBefore.toString(),
				conflictFiles: stashResult,
				reverseMerge: true,
				stashHash: stashOid.toString(),
			},
		};

		await this._state.saveState(state);

		return this._state.stashConflictResolver.convertToMergeResultContent(stashResult);
	}
}
