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
	RepDefaultState,
	RepMergeConflictState,
	RepStashConflictState,
	RepState,
} from "@ext/git/core/Repository/model/RepostoryState";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import Storage from "@ext/storage/logic/Storage";

export default class Repository {
	private _stashConflictResolver: GitStashConflictResolver;
	private _mergeConflictResolver: GitMergeConflictResolver;
	constructor(
		private _repoPath: Path,
		private _fp: FileProvider,
		private _gvc: GitVersionControl,
		private _storage: Storage,
		private _state: RepState = null,
	) {
		if (!_state) this._restoreStateToDefault();
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
		recursive,
		onAdd,
		onCommit,
		onPush,
	}: {
		message: string;
		filePaths: Path[];
		data: SourceData;
		recursive?: boolean;
		onAdd?: () => void;
		onCommit?: () => void;
		onPush?: () => void;
	}): Promise<void> {
		await this.gvc.add(filePaths);
		onAdd?.();
		await this.gvc.commit(message, data);
		onCommit?.();
		await this.storage.updateSyncCount();
		await this._push({ recursive, data, onPush });
		await this.gvc.update();
	}

	async sync({
		data,
		recursive,
		onPull,
		onPush,
	}: {
		data: SourceData;
		recursive?: boolean;
		onPull?: () => void;
		onPush?: () => void;
	}): Promise<GitMergeResultContent[]> {
		let toPush = (await this.storage.getSyncCount()).push;
		if (toPush > 0) {
			// TODO:
			// handle commit merge too
		}

		const beforePullVersion = await this.gvc.getCurrentVersion();
		const stashMergeResult = await this._pull({ recursive, data, onPull });

		await this.gvc.update();
		const afterPullVersion = await this.gvc.getCurrentVersion();

		toPush = (await this.storage.getSyncCount()).push;

		await this.gvc.checkChanges(beforePullVersion, afterPullVersion);
		if (toPush > 0) await this._push({ recursive, data, onPush });
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
		if (haveInternet && !allBranches.includes(branch)) await this.storage.fetch(data);
		await this.gvc.checkoutToBranch(branch);
		let mergeFiles: GitMergeResultContent[] = [];

		if (haveInternet) {
			try {
				mergeFiles = await this._pull({ data });
			} catch (e) {
				await this.gvc.checkoutToBranch(oldBranch.toString());
				throw e;
			}
		}

		onCheckout?.(branch);
		haveInternet && onPull?.();

		await this.gvc.update();
		const newVersion = await this.gvc.getCurrentVersion();

		await this.gvc.checkChanges(oldVersion, newVersion);

		return mergeFiles;
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

		(this._state as RepMergeConflictState) = {
			value: "mergeConflict",
			data: {
				branchNameBefore,
				theirs: branchNameBefore,
				conflictFiles: mergeResult,
				deleteAfterMerge,
				reverseMerge: true,
			},
		};

		return this._mergeConflictResolver.convertToMergeResultContent(mergeResult);
	}

	get state(): RepState {
		return this._state;
	}

	async resolveMerge(files: GitMergeResultContent[], data: SourceData) {
		if (this._state.value !== "mergeConflict" && this._state.value !== "stashConflict") return;
		if (this._state.value === "mergeConflict") {
			const mergeState = this._state as RepMergeConflictState;
			await this._mergeConflictResolver.resolveConflictedFiles(files, mergeState, data);
			if (mergeState.data.deleteAfterMerge) await this._deleteBranch(mergeState.data.theirs, data);
		} else if (this._state.value === "stashConflict")
			await this._stashConflictResolver.resolveConflictedFiles(files, this._state as RepStashConflictState, data);
		this._restoreStateToDefault();
	}

	async abortMerge(data: SourceData) {
		if (this._state.value !== "mergeConflict" && this._state.value !== "stashConflict") return;
		if (this._state.value === "mergeConflict")
			await this._mergeConflictResolver.abortMerge(this._state as RepMergeConflictState, data);
		else if (this._state.value === "stashConflict")
			await this._stashConflictResolver.abortMerge(this._state as RepStashConflictState, data);

		this._restoreStateToDefault();
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
		const storageType = await this.storage.getType();
		const isGit = [SourceType.git, SourceType.gitHub, SourceType.gitLab].includes(storageType);

		if (branchRemoteName && isGit)
			await (this.storage as GitStorage).deleteRemoteBranch(branchRemoteName, data as GitSourceData);

		await this.gvc.deleteLocalBranch(branchName);
	}

	private _restoreStateToDefault() {
		(this._state as RepDefaultState) = { value: "default" };
	}

	private async _push({
		data,
		recursive = true,
		onPush,
	}: {
		data: SourceData;
		recursive?: boolean;
		onPush?: () => void;
	}): Promise<void> {
		try {
			await this.storage.push(data, recursive);
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
		let stashResult: GitMergeResult[] = [];
		const commitHeadBefore = await this.gvc.getCurrentVersion();
		const stashOid = (await this.gvc.getChanges()).length > 0 ? await this.gvc.stash(data) : undefined;

		try {
			await this.storage.pull(data, recursive);
		} catch (e) {
			await this.gvc.hardReset(commitHeadBefore);
			if (stashOid) {
				await this.gvc.applyStash(stashOid);
				await this.gvc.deleteStash(stashOid);
			}
			throw e;
		}

		if (stashOid) stashResult = await this.gvc.applyStash(stashOid);

		onPull?.();

		if (!stashResult.length) return [];

		(this._state as RepStashConflictState) = {
			value: "stashConflict",
			data: {
				commitHeadBefore: commitHeadBefore.toString(),
				conflictFiles: stashResult,
				reverseMerge: true,
				stashHash: stashOid.toString(),
			},
		};

		return this._stashConflictResolver.convertToMergeResultContent(stashResult);
	}
}
