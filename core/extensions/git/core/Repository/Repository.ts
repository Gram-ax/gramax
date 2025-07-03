import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type Path from "@core/FileProvider/Path/Path";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import type { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import type { GcOptions } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import DiffItemContent from "@ext/git/core/GitDiffItemCreator/DiffItemContent/DiffItemContent";
import MergeRequestCommands from "@ext/git/core/GitMergeRequest/logic/MergeRequestCommands";
import type GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import type { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import type RepositoryStateProvider from "@ext/git/core/Repository/state/RepositoryState";
import ScopedCatalogs from "@ext/git/core/ScopedCatalogs/ScopedCatalogs";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Storage from "@ext/storage/logic/Storage";

export type Credentials = { data: SourceData };

export type RepositoryEvents = Event<"publish", { repo: Repository }> &
	Event<"checkout", { repo: Repository; branch: string }> &
	Event<"sync", { repo: Repository; isVersionChanged: boolean }> &
	Event<"fetch", { repo: Repository; force: boolean }>;

export type PublishOptions = (
	| {
			commitMessage: string;
			filesToPublish: Path[];
			onAdd?: () => void;
			onCommit?: () => void;
			onlyPush?: false;
	  }
	| {
			onlyPush: true;
	  }
) & {
	onPush?: () => void | Promise<void>;
	restoreIfFail?: boolean;
} & Credentials;

export type SyncOptions = Credentials & {
	recursivePull: boolean;
	onPull?: () => void;
	onPush?: () => void;
};

export type CheckoutOptions = Credentials & {
	branch: string;
	onCheckout?: (branch: string) => void;
	force?: boolean;
	onPull?: () => void;
};

export type MergeOptions = Credentials & {
	targetBranch: string;
	deleteAfterMerge: boolean;
	validateMerge?: boolean;
	squash?: boolean;
	isMergeRequest?: boolean;
};

export type IsShouldSyncOptions = Credentials & { shouldFetch?: boolean; onFetch?: () => void };

export default abstract class Repository {
	protected _mergeRequests: MergeRequestCommands;
	protected _diffItemContent: DiffItemContent;
	protected _cachedStatus: GitStatus[] = null;
	protected _events = createEventEmitter<RepositoryEvents>();
	private _scopedCatalogs = new ScopedCatalogs(this);

	constructor(
		protected _repoPath: Path,
		protected _fp: FileProvider,
		protected _gvc: GitVersionControl,
		protected _storage: Storage,
	) {
		if (!this._fp || !this._repoPath) return;
		this._mergeRequests = new MergeRequestCommands(this._fp, this._repoPath, this);
		this._storage?.events.on("fetch", (e) => this._events.emit("fetch", { repo: this, force: e.force }));
	}

	get scopedCatalogs(): ScopedCatalogs {
		return this._scopedCatalogs;
	}

	get diffItemContent(): DiffItemContent {
		return this._diffItemContent;
	}

	set diffItemContent(value: DiffItemContent) {
		this._diffItemContent = value;
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
		this._storage.events.on("fetch", (e) => this._events.emit("fetch", { repo: this, force: e.force }));
	}

	resetCachedStatus() {
		this._cachedStatus = null;
	}

	async checkoutToDefaultBranch(data: SourceData, force: boolean): Promise<void> {
		const defaultBranch = await this.storage.getDefaultBranch(data);
		if (!defaultBranch) throw new DefaultError("Can't find default branch to checkout");
		await this.checkout({ data, branch: defaultBranch.toString(), force });
	}

	async gc(opts: GcOptions) {
		return this._gvc.gc(opts);
	}

	abstract publish(opts: PublishOptions): Promise<void>;
	abstract sync(opts: SyncOptions): Promise<GitMergeResultContent[]>;
	abstract checkout(opts: CheckoutOptions): Promise<GitMergeResultContent[]>;
	abstract validateMerge(): Promise<void>;
	abstract merge(opts: MergeOptions): Promise<GitMergeResultContent[]>;
	abstract status(cached?: boolean): Promise<GitStatus[]>;
	abstract isShouldSync(opts: IsShouldSyncOptions): Promise<boolean>;
	abstract canSync(): Promise<boolean>;
	abstract deleteBranch(targetBranch: string, data: SourceData): Promise<void>;
	abstract getState(): Promise<RepositoryStateProvider>;
	abstract checkoutIfCurrentBranchNotExist(data: SourceData, force?: boolean): Promise<{ hasCheckout: boolean }>;
}
