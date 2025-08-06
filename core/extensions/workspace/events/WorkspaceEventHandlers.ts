import EventHandlerProvider from "@core/Event/EventHandlerProvider";
import CatalogTagFilter from "@ext/CatalogPropertyFilter/events/CatalogPropertyFilter";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import ScopedCatalogsResolver from "@ext/git/core/ScopedCatalogs/events/ScopedCatalogsResolver";
import CatalogVersionResolver from "@ext/versioning/events/CatalogVersionResolver";
import type { Workspace } from "@ext/workspace/Workspace";

export default class WorkspaceEventHandlers extends EventHandlerProvider {
	constructor(workspace: Workspace, private rp: RepositoryProvider) {
		super();
		this._handlers = [
			new CatalogTagFilter(workspace),
			new CatalogVersionResolver(workspace, rp),
			new ScopedCatalogsResolver(workspace, rp),
		];
	}
}
