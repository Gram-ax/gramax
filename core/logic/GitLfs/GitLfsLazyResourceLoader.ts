import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import Path from "@core/FileProvider/Path/Path";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type ResourceManager from "@core/Resource/ResourceManager";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { isLikelyLfsPointer } from "./utils";

export default class GitLfsLazyResourceLoader implements EventHandlerCollection {
	private _batch = new Set<string>();

	private _batchPromise: Promise<void> | null = null;

	private _batchTimeoutId: NodeJS.Timeout | null = null;
	private _batchMaxTimeoutId: NodeJS.Timeout | null = null;

	private _batchResolve: (value: void | PromiseLike<void>) => void;
	private _batchReject: (reason?: any) => void;

	private _batchSourceData: GitSourceData = null;
	private _batchTimeout = 300;
	private _batchMaxTimeout = 1700;
	private _isBatchPerforming = false;

	constructor(
		private _catalog: ReadonlyCatalog,
		private _resourceManager: ResourceManager,
		private _rp: RepositoryProvider,
	) {}

	mount(): void {
		this._resourceManager.events.on("content-read", async ({ path, ctx, content, out }) => {
			if (!content || !isLikelyLfsPointer(content) || !ctx) return;

			const sourceData = this._rp.getSourceData(
				ctx,
				await this._catalog.repo.storage.getSourceName(),
			) as GitSourceData;

			await this._batched(path, sourceData);
			out.out = true;
		});
	}

	private _batched(path: Path, sourceData: GitSourceData): Promise<void> {
		this._initPromiseIfNeed();
		this._performBatchIfSourceDataChanged(sourceData);

		if (!this._batchMaxTimeoutId) {
			this._batchMaxTimeoutId = setTimeout(() => {
				this._performBatch();
			}, this._batchMaxTimeout);
		}

		clearTimeout(this._batchTimeoutId);
		this._batchTimeoutId = setTimeout(() => {
			this._performBatch();
		}, this._batchTimeout);

		this._batch.add(path.value);

		return this._batchPromise;
	}

	private _performBatch() {
		if (this._isBatchPerforming || this._batchPromise === null) return;
		this._isBatchPerforming = true;

		this._clearTimeouts();
		const sourceData = this._batchSourceData;

		const repo = this._catalog.repo;
		if (!repo?.gvc) {
			this._batchReject(new Error("provided catalog does not have gvc; can not perform batched lfs pull"));
			this._resetBatchState();
			return;
		}

		repo.gvc
			.pullLfsObjects(
				sourceData,
				this._batch
					.values()
					.map((p) => new Path(p))
					.toArray(),
				!this._catalog.deref.isFpReadOnly, // if fp is readonly this is likely a view of catalog on some non-head commit so we don't need to checkout the objects
			)
			.then(() => {
				this._batchResolve();
				this._resetBatchState();
				return undefined;
			})
			.catch((error) => {
				this._batchReject(error);
				this._resetBatchState();
				throw error;
			});
	}

	private _resetBatchState() {
		this._batchPromise = null;
		this._batch.clear();
		this._batchSourceData = null;
		this._batchTimeoutId = null;
		this._batchMaxTimeoutId = null;
		this._isBatchPerforming = false;
	}
	private _initPromiseIfNeed() {
		if (this._batchPromise === null) {
			this._batchPromise = new Promise<void>((resolve, reject) => {
				this._batchResolve = resolve;
				this._batchReject = reject;
			});
		}
	}

	private _performBatchIfSourceDataChanged(sourceData: GitSourceData) {
		if (this._batchSourceData && sourceData && sourceData?.token != this._batchSourceData.token) {
			this._performBatch();
			this._initPromiseIfNeed();
		}
		if (!this._batchSourceData) this._batchSourceData = sourceData;
	}

	private _clearTimeouts() {
		clearTimeout(this._batchTimeoutId);
		clearTimeout(this._batchMaxTimeoutId);
	}
}
