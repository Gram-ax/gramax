import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type Path from "@core/FileProvider/Path/Path";
import type { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import MergeRequestCommands from "@ext/git/core/GitMergeRequest/MergeRequestCommands";
import type GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import type { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import type RepositoryStateProvider from "@ext/git/core/Repository/state/RepositoryState";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Storage from "@ext/storage/logic/Storage";

export type Credentials = { data: SourceData };

export type RepositoryEvents = Event<"publish", { repo: Repository }> &
	Event<"checkout", { repo: Repository; branch: string }> &
	Event<"sync", { repo: Repository; isVersionChanged: boolean }>;

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
	validateMerge?: boolean;
};

export type IsShouldSyncOptions = Credentials & { shouldFetch?: boolean; onFetch?: () => void };

export default abstract class Repository {
	protected _mergeRequests: MergeRequestCommands;
	protected _cachedStatus: GitStatus[] = null;
	protected _events = createEventEmitter<RepositoryEvents>();

	constructor(
		protected _repoPath: Path,
		protected _fp: FileProvider,
		protected _gvc: GitVersionControl,
		protected _storage: Storage,
	) {
		if (!this._fp || !this._repoPath) return;
		this._mergeRequests = new MergeRequestCommands(this._fp, this._repoPath, this);
	}

	get gvc(): GitVersionControl {
		return this._gvc;
	}

	get mergeRequests(): MergeRequestCommands {
		return this._mergeRequests;
	}

	get storage(): Storage {
		return this._storage;
	}

	get isBare(): boolean {
		return false;
	}

	get events() {
		return this._events;
	}

	update(repoPath: Path, gvc: GitVersionControl, storage: Storage, fp: FileProvider) {
		this._repoPath = repoPath;
		this._gvc = gvc;
		this._storage = storage;
		this._fp = fp;
	}

	resetCachedStatus() {
		this._cachedStatus = null;
	}

	abstract publish(opts: PublishOptions): Promise<void>;
	abstract sync(opts: SyncOptions): Promise<GitMergeResultContent[]>;
	abstract checkout(opts: CheckoutOptions): Promise<GitMergeResultContent[]>;
	abstract validateMerge(): Promise<void>;
	abstract merge(opts: MergeOptions): Promise<GitMergeResultContent[]>;
	abstract status(): Promise<GitStatus[]>;
	abstract isShouldSync(opts: IsShouldSyncOptions): Promise<boolean>;
	abstract canSync(): Promise<boolean>;
	abstract deleteBranch(targetBranch: string, data: SourceData): Promise<void>;
	abstract getState(): Promise<RepositoryStateProvider>;
	abstract checkoutIfCurrentBranchNotExist(data: SourceData): Promise<{ hasCheckout: boolean }>;
}
