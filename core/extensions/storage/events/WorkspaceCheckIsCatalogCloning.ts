import { getExecutingEnvironment } from "@app/resolveModule/env";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import type { Workspace } from "@ext/workspace/Workspace";

export default class WorkspaceCheckIsCatalogCloning implements EventHandlerCollection {
	constructor(private _workspace: Workspace, private _rp: RepositoryProvider) {}

	mount(): void {
		if (!(getExecutingEnvironment() === "browser" || getExecutingEnvironment() === "tauri")) return;

		this._workspace.events.on("on-entries-read", ({ mutableEntries }) =>
			this.tryReviveCloneProgress(mutableEntries.entries),
		);
	}

	async tryReviveCloneProgress(entries: CatalogEntry[]) {
		const fs = this._workspace.getFileStructure();
		const all = entries.map((e) => e.basePath);
		const cancelTokens = await GitStorage.getAllCancelTokens(fs.fp.default(), fs.fp.default().rootPath);

		this._rp.cleanupProgressCache(fs, all);

		for (const entry of entries) {
			await this._rp.tryReviveCloneProgress(this._workspace, entry.basePath, entry.props, cancelTokens);
		}
	}
}
