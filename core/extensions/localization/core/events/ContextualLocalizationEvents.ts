import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";

export default class ContextualLocalizationEvents implements EventHandlerCollection {
	private _cached: CatalogProps;

	constructor(private readonly _catalog: ContextualCatalog) {}

	mount() {
		this._catalog.events.on("props-resolve", ({ mutableProps }) => {
			if (this._cached) {
				mutableProps.props = this._cached;
				return;
			}

			if (!mutableProps.props.language) return;
			const root = resolveRootCategory(this._catalog, mutableProps.props, this._catalog.ctx.contentLanguage);
			if (!root) return;

			const { contactEmail, description, relatedLinks, title } = root.props;

			mutableProps.props = {
				...mutableProps.props,
				title: title || mutableProps.props.title,
				contactEmail: contactEmail || mutableProps.props.contactEmail,
				description: description || mutableProps.props.description,
				relatedLinks: relatedLinks || mutableProps.props.relatedLinks,
			};

			this._cached = mutableProps.props;
		});
	}
}
