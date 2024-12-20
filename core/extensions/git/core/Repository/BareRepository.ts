import type FileProvider from "@core/FileProvider/model/FileProvider";
import type Path from "@core/FileProvider/Path/Path";
import type { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import type GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import type { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import Repository, { type CheckoutOptions, type SyncOptions } from "@ext/git/core/Repository/Repository";
import RepositoryStateProvider from "@ext/git/core/Repository/state/RepositoryState";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import type Storage from "@ext/storage/logic/Storage";

export default class BareRepository extends Repository {
	private _state: RepositoryStateProvider;

	constructor(repoPath: Path, fp: FileProvider, gvc: GitVersionControl, storage: Storage) {
		super(repoPath, fp, gvc, storage);
		this._state = new RepositoryStateProvider(this, this._repoPath, this._fp);
	}

	get isBare() {
		return true;
	}

	publish(): Promise<void> {
		throw new Error("Publishing is not supported for bare repositories.");
	}

	async sync(opts: SyncOptions): Promise<GitMergeResultContent[]> {
		const beforePullVersion = await this.gvc.getCurrentVersion();
		await this._storage.fetch(opts.data);
		await this.checkoutIfCurrentBranchNotExist(opts.data);
		await this._storage.fetch(opts.data, true);
		await this.gvc.update();
		const afterPullVersion = await this.gvc.getCurrentVersion();
		await this.gvc.checkChanges(beforePullVersion, afterPullVersion);
		return [];
	}

	status(): Promise<GitStatus[]> {
		return Promise.resolve([]);
	}

	async checkout(opts: CheckoutOptions): Promise<GitMergeResultContent[]> {
		const prev = await this.gvc.getCurrentVersion();
		await this.gvc.setHead(opts.branch.toString());
		await this.gvc.update();
		const newVersion = await this.gvc.getCurrentVersion();
		await this.gvc.checkChanges(prev, newVersion);
		return [];
	}

	validateMerge(): Promise<void> {
		return Promise.resolve();
	}

	merge(): never {
		throw new Error("Merging is not supported for bare repositories.");
	}

	async isShouldSync(): Promise<boolean> {
		return Promise.resolve(true);
	}

	canSync(): Promise<boolean> {
		return Promise.resolve(false);
	}

	deleteBranch(): never {
		throw new Error("Deleting branches is not supported for bare repositories.");
	}

	getState(): Promise<RepositoryStateProvider> {
		return Promise.resolve(this._state);
	}

	async checkoutIfCurrentBranchNotExist(data: SourceData): Promise<{ hasCheckout: boolean }> {
		let existInRemote: boolean;
		try {
			existInRemote = !!(
				await this._gvc.getBranch(
					`${await this._storage.getRemoteName()}/${(await this._gvc.getCurrentBranch()).toString()}`,
				)
			).getData().remoteName;
		} catch {
			existInRemote = false;
		}
		if (existInRemote) {
			return { hasCheckout: false };
		}
		try {
			await this.checkout({ branch: "master", data });
		} catch (e) {
			try {
				await this.checkout({ branch: "main", data });
			} catch {
				const branches = (await this._gvc.getAllBranches()).map((b) => b.getData().remoteName);
				await this.checkout({ branch: branches[0], data });
			}
		}
		return { hasCheckout: true };
	}
}
