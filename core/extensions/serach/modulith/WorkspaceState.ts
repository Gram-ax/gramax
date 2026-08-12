import { KeyPhraseArticleSearcher } from "@ext/serach/modulith/keyPhrase/KeyPhraseArticleSearcher";
import {
	CombinedProgressManager,
	DefaultProgressManager,
	NullProgressManager,
	type ProgressManager,
} from "@ext/serach/modulith/ProgressManager";
import type { ResourceFilter } from "@ext/serach/Searcher";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { Lock, MultiLock, SemaphoreLock } from "@ics/article-search-utils";

export const CATALOG_PARALLEL_LIMIT = 5;

export class WorkspaceState {
	private readonly _indexingLock = new Lock();
	private readonly _resourceIndexingLock = new MultiLock();
	private readonly _resourceParsingLock = new MultiLock();
	private readonly _catalogIndexingLock = new MultiLock();
	private readonly _catalogIndexingSemaphore = new SemaphoreLock(CATALOG_PARALLEL_LIMIT);
	private readonly _catalogReindexPending = new Set<string>();
	private readonly _indexingProgressManager = new DefaultProgressManager();
	private readonly _resourceIndexingProgressManager = new DefaultProgressManager();
	private readonly _indexedCatalogs = new Set<string>();
	private readonly _keyPhraseSearcher = new KeyPhraseArticleSearcher();

	constructor(
		private readonly _path: WorkspacePath,
		public readonly resourceSearchEnabled: boolean,
	) {}

	get path(): WorkspacePath {
		return this._path;
	}

	get keyPhraseSearcher(): KeyPhraseArticleSearcher {
		return this._keyPhraseSearcher;
	}

	get indexingProgressManager(): ProgressManager {
		return this._indexingProgressManager;
	}

	get resourceIndexingProgressManager(): ProgressManager {
		return this.resourceSearchEnabled ? this._resourceIndexingProgressManager : NullProgressManager.instance();
	}

	get resourceParsingLock(): MultiLock {
		return this._resourceParsingLock;
	}

	lockIndexing(): Promise<() => void> {
		return this._indexingLock.lock();
	}

	lockResourceIndexing(key: string): Promise<() => void> {
		return this._resourceIndexingLock.lock(key);
	}

	async startCatalogIndexing(catalogName: string): Promise<(() => void) | null> {
		if (this._catalogReindexPending.has(catalogName)) return null;

		this._catalogReindexPending.add(catalogName);

		const semaphoreRelease = await this._catalogIndexingSemaphore.lock();
		const catalogRelease = await this._catalogIndexingLock.lock(catalogName);
		this._catalogReindexPending.delete(catalogName);

		return () => {
			catalogRelease();
			semaphoreRelease();
		};
	}

	hasIndexedCatalog(catalogName: string): boolean {
		return this._indexedCatalogs.has(catalogName);
	}

	markIndexedCatalog(catalogName: string): void {
		this._indexedCatalogs.add(catalogName);
	}

	resetIndexedCatalog(catalogName: string): void {
		this._indexedCatalogs.delete(catalogName);
	}

	getCombinedProgressManager(resourceFilter?: ResourceFilter): CombinedProgressManager {
		let pms: ProgressManager[] = [];
		switch (resourceFilter) {
			case "without": {
				pms = [this._indexingProgressManager];
				break;
			}
			case "only": {
				pms = [this._resourceIndexingProgressManager];
				break;
			}
			default: {
				pms = this.resourceSearchEnabled
					? [this._indexingProgressManager, this._resourceIndexingProgressManager]
					: [this._indexingProgressManager];
				break;
			}
		}

		return new CombinedProgressManager(pms);
	}
}
