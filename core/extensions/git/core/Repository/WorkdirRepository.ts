import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import haveInternetAccess from "@core/utils/haveInternetAccess";
import GitMergeResult from "@ext/git/actions/MergeConflictHandler/model/GitMergeResult";
import { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import GitError from "@ext/git/core/GitCommands/errors/GitError";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import Repository, {
	type CheckoutOptions,
	type IsShouldSyncOptions,
	type MergeOptions,
	type PublishOptions,
	type SyncOptions,
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

	constructor(repoPath: Path, fp: FileProvider, gvc: GitVersionControl, storage: Storage) {
		super(repoPath, fp, gvc, storage);
		this._state = new RepositoryStateProvider(this, this._repoPath, this._fp);
	}

	async publish({ commitMessage, filesToPublish, data, onAdd, onCommit, onPush }: PublishOptions): Promise<void> {
		await this.gvc.add(filesToPublish);
		onAdd?.();
		await this.gvc.commit(commitMessage, data);
		onCommit?.();
		await this.storage.updateSyncCount();
		await this._push({ data, onPush });
		await this.gvc.update();
	}

	async canSync(): Promise<boolean> {
		const toPush = (await this.storage.getSyncCount()).push;
		if (toPush > 0) return false;
		const status = await this.gvc.getChanges();
		return !status.length;
	}

	async isShouldSync({ data, onFetch }: IsShouldSyncOptions): Promise<boolean> {
		let toPull = (await this.storage.getSyncCount()).pull;
		if (toPull > 0) return true;

		await this.storage.fetch(data);
		onFetch?.();

		toPull = (await this.storage.getSyncCount()).pull;
		return toPull > 0;
	}

	async sync({ data, recursivePull, onPull, onPush }: SyncOptions): Promise<GitMergeResultContent[]> {
		if (recursivePull) {
			await this.gvc.checkoutSubGitVersionControls();
			const beforePullVersion = await this.gvc.getCurrentVersion();
			const subRepoBeforePullVerisons = await this._getSubmoduleCheckChangesData();

			await this._pull({ recursive: recursivePull, data, onPull });

			await this.gvc.update();

			const afterPullVersion = await this.gvc.getCurrentVersion();
			const subRepoAfterPullVersions = await this._getSubmoduleCheckChangesData();

			await this.gvc.recursiveCheckChanges(
				beforePullVersion,
				afterPullVersion,
				subRepoBeforePullVerisons,
				subRepoAfterPullVersions,
			);
			return [];
		}

		let toPush = (await this.storage.getSyncCount()).push;
		if (toPush > 0) {
			// TODO:
			// handle commit merge too
		}

		const beforePullVersion = await this.gvc.getCurrentVersion();
		const stashMergeResult = await this._pull({ recursive: recursivePull, data, onPull });

		await this.gvc.update();
		const afterPullVersion = await this.gvc.getCurrentVersion();

		toPush = (await this.storage.getSyncCount()).push;

		await this.gvc.checkChanges(beforePullVersion, afterPullVersion);

		if (toPush > 0) await this._push({ data, onPush });
		return stashMergeResult;
	}

	async checkout({ data, branch, onCheckout, onPull }: CheckoutOptions): Promise<GitMergeResultContent[]> {
		const oldVersion = await this.gvc.getCurrentVersion();
		const oldBranch = await this.gvc.getCurrentBranch();
		const allBranches = (await this.gvc.getAllBranches()).map((b) => b.getData().remoteName ?? b.getData().name);
		const haveInternet = haveInternetAccess();

		const state: RepositoryCheckoutState = { value: "checkout", data: { to: branch } };
		await this._state.saveState(state);

		if (haveInternet && !allBranches.includes(branch)) await this.storage.fetch(data);
		await this.gvc.checkoutToBranch(branch);
		onCheckout?.(branch);

		let mergeFiles: GitMergeResultContent[] = [];

		if (haveInternet) {
			try {
				mergeFiles = await this._pull({ data });
				onPull?.();
			} catch (e) {
				await this.gvc.checkoutToBranch(oldBranch.toString());
				await this._state.resetState();
				throw e;
			}
		}

		await this.gvc.update();
		const newVersion = await this.gvc.getCurrentVersion();

		await this.gvc.checkChanges(oldVersion, newVersion);
		await this._state.resetState();
		return mergeFiles;
	}

	async merge({ data, targetBranch, deleteAfterMerge }: MergeOptions): Promise<GitMergeResultContent[]> {
		if ((await this.gvc.getChanges(false)).length > 0)
			throw new GitError(GitErrorCode.WorkingDirNotEmpty, null, { repositoryPath: this.gvc.getPath().value });

		const branchNameBefore = (await this.gvc.getCurrentBranch()).toString();
		await this.checkout({ data, branch: targetBranch });

		const mergeResult = await this.gvc.mergeBranch(data, branchNameBefore);

		if (!mergeResult.length) {
			await this.storage.push(data);
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

	private async _push({ data, onPush }: { data: SourceData; onPush?: () => void }): Promise<void> {
		try {
			await this.storage.push(data);
		} catch (e) {
			await this.gvc.restoreRepositoryState();
			await this.storage.updateSyncCount();
			throw e;
		}
		onPush?.();
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
		const stashOid = await this.gvc.stash(data);

		try {
			await this.storage.pull(data, recursive);
		} catch (e) {
			await this.gvc.hardReset(commitHeadBefore);
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
