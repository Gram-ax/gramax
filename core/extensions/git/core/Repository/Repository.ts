import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import MergeType from "@ext/git/actions/MergeConflictHandler/model/MergeType";
import GitError from "@ext/git/core/GitCommands/errors/GitError";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Storage from "@ext/storage/logic/Storage";
import StorageСhecker from "@ext/storage/logic/StorageСhecker";

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
		const oldVersion = await this.gvc.getCurrentVersion();
		await this._pull({ recursive, data, onPull });
		await this.gvc.update();
		const newVersion = await this.gvc.getCurrentVersion();
		await this._push({ recursive, data, onPush });
		await this.gvc.checkChanges(oldVersion, newVersion);
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
	}): Promise<void> {
		const vcBranch = await this._gvc.getBranch(branch);
		await new StorageСhecker().checkBranch(await this.storage.getData(data), vcBranch);

		const oldVersion = await this._gvc.getCurrentVersion();
		const oldBranch = await this._gvc.getCurrentBranch();
		await this._gvc.checkoutToBranch(branch);
		onCheckout?.(branch);
		await this._gvc.update();
		const newVersion = await this._gvc.getCurrentVersion();

		await this._gvc.checkChanges(oldVersion, newVersion);

		try {
			await this._pull({ data, onPull });
		} catch (e) {
			await this._gvc.checkoutToBranch(oldBranch.toString());
			onCheckout?.(oldBranch.toString());
			throw e;
		}
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
