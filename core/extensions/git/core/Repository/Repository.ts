import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import FileStructure from "@core/FileStructue/FileStructure";
import haveInternetAccess from "@core/utils/haveInternetAccess";
import GitMergeResult from "@ext/git/actions/MergeConflictHandler/model/GitMergeResult";
import { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import GitError from "@ext/git/core/GitCommands/errors/GitError";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import GitMergeConflictResolver from "@ext/git/core/GitMergeConflictResolver/Merge/GitMergeConflictResolver";
import GitStashConflictResolver from "@ext/git/core/GitMergeConflictResolver/Stash/GitStashConflictResolver";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import {
	RepCheckoutState,
	RepMergeConflictState,
	RepStashConflictState,
	RepState,
} from "@ext/git/core/Repository/model/RepostoryState";
import RepositoryStateFile from "@ext/git/core/RepositoryStateFile/RepositorySettingsFile";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import { GitVersion } from "@ext/git/core/model/GitVersion";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Storage from "@ext/storage/logic/Storage";

export default class Repository {
	private _stashConflictResolver: GitStashConflictResolver;
	private _mergeConflictResolver: GitMergeConflictResolver;

	private _isFirstLoadState = true;

	constructor(
		private _repoPath: Path,
		private _fp: FileProvider,
		private _gvc: GitVersionControl,
		private _storage: Storage,
		private _repStateFile: RepositoryStateFile,
	) {
		this._stashConflictResolver = new GitStashConflictResolver(this, this._fp, this._repoPath);
		this._mergeConflictResolver = new GitMergeConflictResolver(this, this._fp, this._repoPath);
	}

	get gvc() {
		return this._gvc;
	}

	get storage() {
		return this._storage;
	}

	update(repoPath: Path, gvc: GitVersionControl, storage: Storage, fp: FileProvider) {
		this._repoPath = repoPath;
		this._gvc = gvc;
		this._storage = storage;
		this._fp = fp;
	}

	async publish({
		message,
		filePaths,
		data,
		onAdd,
		onCommit,
		onPush,
	}: {
		message: string;
		filePaths: Path[];
		data: SourceData;
		onAdd?: () => void;
		onCommit?: () => void;
		onPush?: () => void;
	}): Promise<void> {
		await this.gvc.add(filePaths);
		onAdd?.();
		await this.gvc.commit(message, data);
		onCommit?.();
		await this.storage.updateSyncCount();
		await this._push({ data, onPush });
		await this.gvc.update();
	}

	async sync({
		data,
		recursivePull,
		onPull,
		onPush,
	}: {
		data: SourceData;
		recursivePull?: boolean;
		onPull?: () => void;
		onPush?: () => void;
	}): Promise<GitMergeResultContent[]> {
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

	async checkout({
		data,
		branch,
		onCheckout,
		onPull,
	}: {
		data: SourceData;
		branch: string;
		onCheckout?: (branch: string) => void;
		onPull?: () => void;
	}): Promise<GitMergeResultContent[]> {
		const oldVersion = await this.gvc.getCurrentVersion();
		const oldBranch = await this.gvc.getCurrentBranch();
		const allBranches = (await this.gvc.getAllBranches()).map((b) => b.getData().remoteName ?? b.getData().name);
		const haveInternet = haveInternetAccess();

		const state: RepCheckoutState = { value: "checkout", data: { to: branch } };
		await this._repStateFile.saveState(state);

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
				await this._restoreStateToDefault();
				throw e;
			}
		}

		await this.gvc.update();
		const newVersion = await this.gvc.getCurrentVersion();

		await this.gvc.checkChanges(oldVersion, newVersion);
		await this._restoreStateToDefault();
		return mergeFiles;
	}

	async abortCheckoutState() {
		if ((await this.getState()).value !== "checkout") return;
		return this._restoreStateToDefault();
	}

	async haveToPull({ data, onFetch }: { data: SourceData; onFetch?: () => void }): Promise<boolean> {
		let toPull = (await this.storage.getSyncCount()).pull;
		if (toPull > 0) return true;

		await this.storage.fetch(data);
		onFetch?.();

		toPull = (await this.storage.getSyncCount()).pull;
		return toPull > 0;
	}

	async canPull(): Promise<boolean> {
		const toPush = (await this.storage.getSyncCount()).push;
		if (toPush > 0) return false;
		const status = await this.gvc.getChanges();
		return !status.length;
	}

	async mergeInto(branchName: string, deleteAfterMerge: boolean, data: SourceData): Promise<GitMergeResultContent[]> {
		if ((await this.gvc.getChanges(false)).length > 0)
			throw new GitError(GitErrorCode.WorkingDirNotEmpty, null, { repositoryPath: this.gvc.getPath().value });

		const branchNameBefore = (await this.gvc.getCurrentBranch()).toString();
		await this.checkout({ data, branch: branchName });

		const mergeResult = await this.gvc.mergeBranch(data, branchNameBefore);

		if (!mergeResult.length) {
			await this.storage.push(data);
			if (deleteAfterMerge) await this._deleteBranch(branchNameBefore, data);
			return [];
		}

		const state: RepMergeConflictState = {
			value: "mergeConflict",
			data: {
				branchNameBefore,
				theirs: branchNameBefore,
				conflictFiles: mergeResult,
				deleteAfterMerge,
				reverseMerge: true,
			},
		};
		await this._repStateFile.saveState(state);

		return this._mergeConflictResolver.convertToMergeResultContent(mergeResult);
	}

	async getState(): Promise<RepState> {
		const repState = await this._repStateFile.getState();
		if (!this._isFirstLoadState) return repState;

		this._isFirstLoadState = false;

		if (repState.value === "checkout") {
			await this._restoreStateToDefault();
			return this._repStateFile.getState();
		}

		return repState;
	}

	async resolveMerge(files: { path: string; content: string }[], data: SourceData) {
		const state = await this.getState();
		if (state.value !== "mergeConflict" && state.value !== "stashConflict") return;
		if (state.value === "mergeConflict") {
			const mergeState = state as RepMergeConflictState;
			await this._mergeConflictResolver.resolveConflictedFiles(files, mergeState, data);
			if (mergeState.data.deleteAfterMerge) await this._deleteBranch(mergeState.data.theirs, data);
		} else if (state.value === "stashConflict")
			await this._stashConflictResolver.resolveConflictedFiles(files, state as RepStashConflictState, data);
		await this._restoreStateToDefault();
	}

	async abortMerge(data: SourceData) {
		const state = await this.getState();

		if (state.value !== "mergeConflict" && state.value !== "stashConflict") return;
		if (state.value === "mergeConflict")
			await this._mergeConflictResolver.abortMerge(state as RepMergeConflictState, data);
		else if (state.value === "stashConflict")
			await this._stashConflictResolver.abortMerge(state as RepStashConflictState, data);

		await this._restoreStateToDefault();
	}

	async isMergeStateValid(): Promise<boolean> {
		const state = await this.getState();
		if (state.value === "mergeConflict" || state.value === "stashConflict") {
			const isValid = await this._mergeConflictResolver.isMergeStateValidate(
				(state as RepMergeConflictState | RepStashConflictState).data.conflictFiles,
			);
			if (!isValid) await this._restoreStateToDefault();
			return isValid;
		}
	}

	async convertToMergeResultContent(
		mergeResult: GitMergeResult[],
		fs?: FileStructure,
	): Promise<GitMergeResultContent[]> {
		return this._mergeConflictResolver.convertToMergeResultContent(mergeResult, fs);
	}

	private async _deleteBranch(branchName: string, data: SourceData) {
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
		const stashOid = (await this.gvc.getChanges()).length > 0 ? await this.gvc.stash(data) : undefined;

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

		const state: RepStashConflictState = {
			value: "stashConflict",
			data: {
				commitHeadBefore: commitHeadBefore.toString(),
				conflictFiles: stashResult,
				reverseMerge: true,
				stashHash: stashOid.toString(),
			},
		};

		await this._repStateFile.saveState(state);

		return this._stashConflictResolver.convertToMergeResultContent(stashResult);
	}

	private async _restoreStateToDefault() {
		await this._repStateFile.saveState({ value: "default" });
	}
}
