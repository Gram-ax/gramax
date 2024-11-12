import EventHandlerProvider from "@core/Event/EventHandlerProvider";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import CatalogVersionResolver from "@ext/versioning/events/CatalogVersionResolver";
import type { Workspace, WorkspaceEvents } from "@ext/workspace/Workspace";

export default class WorkspaceEventHandlers extends EventHandlerProvider<WorkspaceEvents> {
	constructor(private _workspace: Workspace, private _rp: RepositoryProvider) {
		super();
		this._handlers = [new CatalogVersionResolver(_workspace, _rp)];
	}
}
