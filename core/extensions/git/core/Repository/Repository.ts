import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import MergeType from "@ext/git/actions/MergeConflictHandler/model/MergeType";
import GitError from "@ext/git/core/GitCommands/errors/GitError";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Storage from "@ext/storage/logic/Storage";

export default class Repository {
	constructor(
		private _repoPath: Path,
		private _fp: FileProvider,
		private _gvc: GitVersionControl,
		private _storage: Storage,
	) {}

	get gvc() {
		return this._gvc;
	}

	get storage() {
		return this._storage;
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
		await this._gvc.update();
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
	}): Promise<void> {
		const beforePullVersion = await this.gvc.getCurrentVersion();
		await this._pull({ recursive, data, onPull });
		await this.gvc.update();
		const afterPullVersion = await this.gvc.getCurrentVersion();

		const toPush = (await this._storage.getSyncCount()).push;

		await this.gvc.checkChanges(beforePullVersion, afterPullVersion);
		if (toPush > 0) await this._push({ recursive, data, onPush });
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
		authServiceUrl: string;
	}): Promise<void> {
		const oldVersion = await this._gvc.getCurrentVersion();
		const oldBranch = await this._gvc.getCurrentBranch();
		await this._gvc.checkoutToBranch(branch);

		try {
			await this._pull({ data });
		} catch (e) {
			await this._gvc.checkoutToBranch(oldBranch.toString());
			throw e;
		}

		onCheckout?.(branch);
		onPull?.();

		await this._gvc.update();
		const newVersion = await this._gvc.getCurrentVersion();

		await this._gvc.checkChanges(oldVersion, newVersion);
	}

	async haveToPull({ data, onFetch }: { data: SourceData; onFetch?: () => void }): Promise<boolean> {
		let toPull = (await this._storage.getSyncCount()).pull;
		if (toPull > 0) return true;

		await this.storage.fetch(data);
		onFetch?.();

		toPull = (await this._storage.getSyncCount()).pull;
		return toPull > 0;
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
	}) {
		try {
			await this.storage.pull(data, recursive);
		} catch (error) {
			const e = error as GitError;
			if (
				e.props?.errorCode === GitErrorCode.MergeConflictError ||
				e.props?.errorCode === GitErrorCode.MergeNotSupportedError
			) {
				e.setProps({ mergeType: MergeType.Sync });
			}
			throw e;
		}
		onPull?.();
	}
}
