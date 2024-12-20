import EventHandlerProvider from "@core/Event/EventHandlerProvider";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import CatalogVersionResolver from "@ext/versioning/events/CatalogVersionResolver";
import type { Workspace } from "@ext/workspace/Workspace";

export default class WorkspaceEventHandlers extends EventHandlerProvider {
	constructor(workspace: Workspace, private rp: RepositoryProvider) {
		super();
		this._handlers = [new CatalogVersionResolver(workspace, rp)];
	}
}
