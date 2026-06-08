import { KeyPhraseArticleSearcher } from "@ext/serach/modulith/keyPhrase/KeyPhraseArticleSearcher";
import { ProgressManager } from "@ext/serach/modulith/ProgressManager";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { Lock, MultiLock } from "@ics/article-search-utils";

export class WorkspaceState {
	private readonly _indexingLock = new Lock();
	private readonly _resourceIndexingLock = new MultiLock();
	private readonly _resourceParsingLock = new MultiLock();
	private readonly _indexingProgressManager = new ProgressManager();
	private readonly _resourceIndexingProgressManager = new ProgressManager();
	private readonly _indexedCatalogs = new Set<string>();
	private readonly _keyPhraseSearcher = new KeyPhraseArticleSearcher();
	private readonly _resourceSearchEnabled: boolean;

	constructor(
		private readonly _path: WorkspacePath,
		resourceSearchEnabled: boolean,
	) {
		this._resourceSearchEnabled = resourceSearchEnabled;
	}

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
		return this._resourceIndexingProgressManager;
	}

	get resourceParsingLock(): MultiLock {
		return this._resourceParsingLock;
	}

	get resourceSearchEnabled(): boolean {
		return this._resourceSearchEnabled;
	}

	lockIndexing(): Promise<() => void> {
		return this._indexingLock.lock();
	}

	lockResourceIndexing(key: string): Promise<() => void> {
		return this._resourceIndexingLock.lock(key);
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
}
