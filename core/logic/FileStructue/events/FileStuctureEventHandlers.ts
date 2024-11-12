import EventHandlerProvider from "@core/Event/EventHandlerProvider";
import type FileStructure from "@core/FileStructue/FileStructure";
import type { FSEvents } from "@core/FileStructue/FileStructure";
import FSLocalizationEvents from "@ext/localization/core/events/FSLocalizationEvents";
import CatalogEntryAttachGit from "@ext/versioning/events/CatalogEntryAttachGit";

export default class FileStructureEventHandlers extends EventHandlerProvider<FSEvents> {
	constructor(fs: FileStructure) {
		super();
		this._handlers = [new CatalogEntryAttachGit(fs), new FSLocalizationEvents(fs)];
	}
}
