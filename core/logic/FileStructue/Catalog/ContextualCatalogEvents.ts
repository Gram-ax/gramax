import EventHandlerProvider from "@core/Event/EventHandlerProvider";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import ContextualCatalogViewEvents from "@ext/catalog/views/logic/events/ContextualViewEvents";
import ContextualLocalizationEvents from "@ext/localization/core/events/ContextualLocalizationEvents";

export default class ContextualCatalogEventHandlers extends EventHandlerProvider {
	constructor(catalog: ContextualCatalog) {
		super();
		this._handlers = [new ContextualLocalizationEvents(catalog), new ContextualCatalogViewEvents(catalog)];
	}
}
