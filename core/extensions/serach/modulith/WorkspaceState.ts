import { KeyPhraseArticleSearcher } from "@ext/serach/modulith/keyPhrase/KeyPhraseArticleSearcher";
import { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { DynamicAggregateProgress, Lock, ProgressCallback } from "@ics/modulith-utils";

export class WorkspaceState {
	private readonly _indexingLock = new Lock();
	private readonly _progressSubscribers = new Set<ProgressCallback>();
	private readonly _indexedCatalogs = new Set<string>();
	private readonly _doneProgresses = new Set<unknown>();
	private readonly _indexingProgress = new DynamicAggregateProgress({
		onChange: (p) => {
			if (this._indexingProgress.getProgressesCount() === 0) p = 1;
			return this._progressSubscribers.forEach((x) => x(p));
		},
	});
	private readonly _keyPhraseSearcher = new KeyPhraseArticleSearcher();

	constructor(private readonly _path: WorkspacePath) {}

	get path(): WorkspacePath {
		return this._path;
	}

	get keyPhraseSearcher(): KeyPhraseArticleSearcher {
		return this._keyPhraseSearcher;
	}

	lockIndexing(): Promise<() => void> {
		return this._indexingLock.lock();
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

	addProgressSubscriber(pc: ProgressCallback): void {
		this._progressSubscribers.add(pc);
	}

	removeProgressSubscriber(pc: ProgressCallback): void {
		this._progressSubscribers.delete(pc);
	}

	addProgress(): unknown {
		return this._indexingProgress.addProgress();
	}

	setProgress(prid: unknown, value: number): void {
		this._indexingProgress.setProgress(prid, value);
	}

	getTotalProgress(): number {
		return this._indexingProgress.getTotalProgress();
	}

	getProgressCallback(prid: unknown): ProgressCallback {
		return this._indexingProgress.getProgressCallback(prid);
	}

	hasProgresses(): boolean {
		return this._indexingProgress.getProgressesCount() > 0;
	}

	doneProgress(prid: unknown) {
		this._doneProgresses.add(prid);
		if (this._doneProgresses.size == this._indexingProgress.getProgressesCount()) {
			this._doneProgresses.forEach((x) => this._indexingProgress.removeProgress(x));
			this._doneProgresses.clear();
		}
	}
}
