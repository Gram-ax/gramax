import { UnsubscribeToken } from "@core/Event/EventEmitter";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type FileStructure from "@core/FileStructue/FileStructure";
import DiffItemContent from "@ext/git/core/GitDiffItemCreator/DiffItemContent/DiffItemContent";

export default class FSDiffItemContentEvents implements EventHandlerCollection {
	// For some reason we need to save unsubscribe token address from "catalog-read" event
	private _unsubribeTokens: UnsubscribeToken[] = [];

	constructor(private _fs: FileStructure) {}

	mount(): void {
		this._unsubribeTokens.push(
			this._fs.events.on("catalog-read", ({ catalog }) => {
				catalog.events.on("repository-set", ({ catalog }) => {
					if (catalog.repo.diffItemContent) return;
					catalog.repo.diffItemContent = new DiffItemContent(catalog, this._fs);
				});
			}),
		);
	}
}
