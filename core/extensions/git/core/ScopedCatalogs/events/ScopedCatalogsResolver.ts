import { getExecutingEnvironment } from "@app/resolveModule/env";
import { UnsubscribeToken } from "@core/Event/EventEmitter";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import type { Workspace } from "@ext/workspace/Workspace";

export default class ScopedCatalogsResolver implements EventHandlerCollection {
	private _unsubscribeTokens: UnsubscribeToken[] = [];

	constructor(private _workspace: Workspace, private _rp: RepositoryProvider) {}

	mount(): void {
		if (getExecutingEnvironment() === "next") return; // todo: add support in docportal

		const token = this._workspace.events.on("on-catalog-resolve", async ({ mutableCatalog, metadata }) => {
			const refname = metadata;
			if (!refname || !mutableCatalog.catalog) return;

			if (mutableCatalog.catalog.props.filterProperties?.includes(refname)) return;

			const gvc = mutableCatalog.catalog?.repo?.gvc;
			if (!gvc) return;
			const isCommit = refname.startsWith("commit-");
			const commitHash = isCommit ? refname.slice("commit-".length) : null;

			const catalog = await mutableCatalog.catalog.repo.scopedCatalogs.getScopedCatalog(
				mutableCatalog.catalog.basePath,
				this._workspace.getFileStructure(),
				isCommit ? { commit: commitHash } : { reference: refname },
			);

			mutableCatalog.catalog = await catalog.load();
		});

		this._unsubscribeTokens.push(token);
	}
}
