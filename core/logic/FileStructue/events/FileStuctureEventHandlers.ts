import EventHandlerProvider from "@core/Event/EventHandlerProvider";
import FSCollisionHealEvents from "@core/FileStructue/events/FSCollisionHealEvents";
import type FileStructure from "@core/FileStructue/FileStructure";
import type ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import FSDiffItemContentEvents from "@ext/git/core/GitDiffItemCreator/DiffItemContent/FSDiffItemContentEvents";
import FSLocalizationEvents from "@ext/localization/core/events/FSLocalizationEvents";
import FSPropertyEvents from "@ext/properties/logic/events/FSPropertyEvents";
import FSCatalogEntryAttachGit from "@ext/versioning/events/FSCatalogEntryAttachGit";

export default class FileStructureEventHandlers extends EventHandlerProvider {
	constructor(fs: FileStructure, resourceUpdaterFactory?: ResourceUpdaterFactory) {
		super();
		this._handlers = [
			new FSCatalogEntryAttachGit(fs),
			new FSLocalizationEvents(fs),
			new FSDiffItemContentEvents(fs),
			new FSPropertyEvents(fs),
		];
		if (resourceUpdaterFactory) this._handlers.push(new FSCollisionHealEvents(fs, resourceUpdaterFactory));
	}
}
