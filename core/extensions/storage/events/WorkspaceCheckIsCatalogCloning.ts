import { getExecutingEnvironment } from "@app/resolveModule/env";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import type { Workspace } from "@ext/workspace/Workspace";

export default class WorkspaceCheckIsCatalogCloning implements EventHandlerCollection {
	constructor(
		private _workspace: Workspace,
		private _rp: RepositoryProvider,
	) {}

	mount(): void {
		if (!(getExecutingEnvironment() === "web" || getExecutingEnvironment() === "tauri")) return;

		this._workspace.events.on("on-entries-read", ({ mutableEntries }) =>
			this.tryReviveCloneProgress(mutableEntries),
		);
	}

	async tryReviveCloneProgress(mutableEntries: { entries: CatalogEntry[] }) {
		const fs = this._workspace.getFileStructure();
		const cancelTokens = await GitStorage.getAllCancelTokens(fs.fp.default(), fs.fp.default().rootPath);

		const revive = (entry: CatalogEntry) =>
			this._rp.tryReviveCloneProgress(this._workspace, entry.basePath, entry.props, cancelTokens);

		// A clone waiting for a free slot has created nothing on disk, so the entry scan misses it entirely.
		// Rebuild those entries from the saved clone list before anything looks at the scan result — without
		// them the catalog silently vanishes from the workspace while its clone keeps running.
		for (const path of this._rp.getSavedClonePaths(fs)) {
			if (mutableEntries.entries.some((e) => e.basePath.compare(path))) continue;

			const entry = await fs.getCatalogEntryByPath(path, false);
			revive(entry);
			// revive marks the entry as cloning only while the clone is still alive; anything else is a
			// leftover from a previous run and must not resurrect a catalog that has no content.
			if (entry.props.isCloning) mutableEntries.entries.push(entry);
		}

		this._rp.cleanupProgressCache(
			fs,
			mutableEntries.entries.map((e) => e.basePath),
		);

		for (const entry of mutableEntries.entries) revive(entry);
	}
}
