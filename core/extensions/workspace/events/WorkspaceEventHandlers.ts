import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import EventHandlerProvider from "@core/Event/EventHandlerProvider";
import RepositoryHealthcheckHandler from "@ext/git/core/Repository/events/RepositoryHealthcheckHandler";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import ScopedCatalogsResolver from "@ext/git/core/ScopedCatalogs/events/ScopedCatalogsResolver";
import WorkspaceCheckIsCatalogCloning from "@ext/storage/events/WorkspaceCheckIsCatalogCloning";
import CatalogVersionResolver from "@ext/versioning/events/CatalogVersionResolver";
import WebhookPeerNotifier from "@ext/workspace/events/WebhookPeerNotifier";
import type { Workspace } from "@ext/workspace/Workspace";

export default class WorkspaceEventHandlers extends EventHandlerProvider {
	constructor(workspace: Workspace, rp: RepositoryProvider, events: EventHandlerCollection[]) {
		super();
		this._handlers = [
			new CatalogVersionResolver(workspace, rp),
			new ScopedCatalogsResolver(workspace, rp),
			new RepositoryHealthcheckHandler(workspace, rp),
			new WorkspaceCheckIsCatalogCloning(workspace, rp),
			new WebhookPeerNotifier(workspace),
			...(events ?? []),
		];
	}
}
