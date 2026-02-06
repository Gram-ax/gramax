import { getExecutingEnvironment } from "@app/resolveModule/env";
import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type Path from "@core/FileProvider/Path/Path";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import type { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import type { GcOptions } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type DiffItemContent from "@ext/git/core/GitDiffItemCreator/DiffItemContent/DiffItemContent";
import MergeRequestCommands from "@ext/git/core/GitMergeRequest/logic/MergeRequestCommands";
import type GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import type { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import type GitStash from "@ext/git/core/model/GitStash";
import type { GitVersion } from "@ext/git/core/model/GitVersion";
import type RepositoryStateProvider from "@ext/git/core/Repository/state/RepositoryState";
import ScopedCatalogs from "@ext/git/core/ScopedCatalogs/ScopedCatalogs";
import t from "@ext/localization/locale/translate";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import type Storage from "@ext/storage/logic/Storage";

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

export type IsShouldSyncOptions = Credentials & { shouldFetch?: boolean; onFetch?: () => void; lockFetch?: boolean };

export type SyncResult = {
	mergeData: GitMergeResultContent[];
	isVersionChanged: boolean;
	before: GitVersion;
	after: GitVersion;
};

export default abstract class Repository {
	protected _mergeRequests: MergeRequestCommands;
	protected _diffItemContent: DiffItemContent;
	protected _events = createEventEmitter<RepositoryEvents>();
	private _scopedCatalogs = new ScopedCatalogs(this);

	constructor(
		protected _repoPath: Path,
		protected _fp: FileProvider,
		protected _gvc: GitVersionControl,
		protected _storage: Storage,
		disableMergeRequests: boolean,
	) {
		if (!this._fp || !this._repoPath) return;
		this._mergeRequests = new MergeRequestCommands(this._fp, this._repoPath, this, disableMergeRequests);
		this._storage?.events.on("fetch", (e) => this._events.emit("fetch", { repo: this, force: e.force }));
	}

	get path() {
		return this._repoPath;
	}

	get absolutePath() {
		return this._fp.rootPath.join(this._repoPath);
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

	subscribeFpEvents() {}

	unsubscribeEvents() {}

	update(repoPath: Path, gvc: GitVersionControl, storage: Storage, fp: FileProvider) {
		this._repoPath = repoPath;
		this._gvc = gvc;
		this._storage = storage;
		this._fp = fp;
		this._storage.events.on("fetch", (e) => this._events.emit("fetch", { repo: this, force: e.force }));
	}

	resetCachedStatus() {
		this.gvc?.resetCachedStatus();
	}

	async checkoutToDefaultBranch(data: SourceData, force: boolean): Promise<void> {
		const defaultBranch = await this.storage.getDefaultBranch(data);
		if (!defaultBranch) throw new DefaultError(t("git.branch.error.not-found.default"));
		await this.checkout({ data, branch: defaultBranch.toString(), force });
	}

	async gc(opts: GcOptions) {
		return this._gvc.gc(opts);
	}

	async stash(data: SourceData, doAddBeforeStash = true): Promise<GitStash> {
		const isBrowser = getExecutingEnvironment() === "browser";

		if (!isBrowser) await this.gvc.add();
		const changes = await this.gvc.getChanges("index");
		if (!changes.length) return null;

		return this._gvc.stash(data, isBrowser ? false : doAddBeforeStash);
	}

	abstract publish(opts: PublishOptions): Promise<void>;
	abstract sync(opts: SyncOptions): Promise<SyncResult>;
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
