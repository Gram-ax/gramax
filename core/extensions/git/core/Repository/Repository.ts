import type FileProvider from "@core/FileProvider/model/FileProvider";
import type Path from "@core/FileProvider/Path/Path";
import type { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import type GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import type RepositoryStateProvider from "@ext/git/core/Repository/state/RepositoryState";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Storage from "@ext/storage/logic/Storage";

export type Credentials = { data: SourceData };

export type PublishOptions = Credentials & {
	commitMessage: string;
	filesToPublish: Path[];
	onAdd?: () => void;
	onCommit?: () => void;
	onPush?: () => void;
};

export type SyncOptions = Credentials & {
	recursivePull: boolean;
	onPull?: () => void;
	onPush?: () => void;
};

export type CheckoutOptions = Credentials & {
	branch: string;
	onCheckout?: (branch: string) => void;
	onPull?: () => void;
};

export type MergeOptions = Credentials & {
	targetBranch: string;
	deleteAfterMerge: boolean;
};

export type IsShouldSyncOptions = Credentials & { onFetch?: () => void };

export default abstract class Repository {
	constructor(
		protected _repoPath: Path,
		protected _fp: FileProvider,
		protected _gvc: GitVersionControl,
		protected _storage: Storage,
	) {}

	get gvc(): GitVersionControl {
		return this._gvc;
	}

	get storage(): Storage {
		return this._storage;
	}

	get isBare(): boolean {
		return false;
	}

	update(repoPath: Path, gvc: GitVersionControl, storage: Storage, fp: FileProvider) {
		this._repoPath = repoPath;
		this._gvc = gvc;
		this._storage = storage;
		this._fp = fp;
	}

	abstract publish(opts: PublishOptions): Promise<void>;
	abstract sync(opts: SyncOptions): Promise<GitMergeResultContent[]>;
	abstract checkout(opts: CheckoutOptions): Promise<GitMergeResultContent[]>;
	abstract merge(opts: MergeOptions): Promise<GitMergeResultContent[]>;
	abstract isShouldSync(opts: IsShouldSyncOptions): Promise<boolean>;
	abstract canSync(): Promise<boolean>;
	abstract deleteBranch(targetBranch: string, data: SourceData): Promise<void>;
	abstract getState(): Promise<RepositoryStateProvider>;
}
