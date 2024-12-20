import EventHandlerProvider from "@core/Event/EventHandlerProvider";
import FileStructure from "@core/FileStructue/FileStructure";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import RepositoryProviderCatalogEntryAttachGit from "@ext/versioning/events/RepositoryProviderCatalogEntryAttachGit";

export default class RepositoryProviderEventHandlers extends EventHandlerProvider {
	constructor(fs: FileStructure, rp: RepositoryProvider) {
		super();
		this._handlers = [new RepositoryProviderCatalogEntryAttachGit(fs, rp)];
	}
}
