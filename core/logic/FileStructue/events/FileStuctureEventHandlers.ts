import EventHandlerProvider from "@core/Event/EventHandlerProvider";
import type FileStructure from "@core/FileStructue/FileStructure";
import FSLocalizationEvents from "@ext/localization/core/events/FSLocalizationEvents";
import FSCatalogEntryAttachGit from "@ext/versioning/events/FSCatalogEntryAttachGit";

export default class FileStructureEventHandlers extends EventHandlerProvider {
	constructor(fs: FileStructure) {
		super();
		this._handlers = [new FSCatalogEntryAttachGit(fs), new FSLocalizationEvents(fs)];
	}
}
