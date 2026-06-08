import type { EventArgs } from "@core/Event/EventEmitter";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type FileStructure from "@core/FileStructue/FileStructure";
import type { FSEvents } from "@core/FileStructue/FileStructure";
import type { ItemEvents } from "@core/FileStructue/Item/Item";
import {
	normalizeArticleProperties,
	normalizeCatalogProperties,
} from "@ext/serach/components/utils/normalizeProperties";

type ItemPreSaveEventArgs = EventArgs<ItemEvents, "item-pre-save"> & { catalog: Catalog };

export default class FSPropertyEvents implements EventHandlerCollection {
	private _refs = [];

	constructor(private _fs: FileStructure) {}

	mount(): void {
		this._refs.push(this._fs.events.on("catalog-read", this._onCatalogRead.bind(this)));
		this._refs.push(this._fs.events.on("item-read", this._onItemRead.bind(this)));
		this._refs.push(this._fs.events.on("before-item-create", this._onBeforeItemCreate.bind(this)));
	}

	private async _onCatalogRead({ catalog }: EventArgs<FSEvents, "catalog-read">) {
		catalog.props.properties = normalizeCatalogProperties(catalog.props.properties);
	}

	private async _onItemRead({ catalog, mutable }: EventArgs<FSEvents, "item-read">) {
		const properties = mutable.props.properties || [];
		const catalogProperties = normalizeCatalogProperties(catalog.props.properties || []);
		const catalogPropertiesMap = new Map(catalogProperties.map((p) => [p.id, p]));
		mutable.props.properties = normalizeArticleProperties(properties, catalogProperties).filter((p) =>
			catalogPropertiesMap.has(p.id),
		);
	}

	private _onBeforeItemCreate({ mutableItem, catalog }: EventArgs<FSEvents, "before-item-create">) {
		mutableItem.item.events.on(
			"item-pre-save",
			async (args: ItemPreSaveEventArgs) => await this._onItemPreSave({ ...args, catalog: catalog }),
		);
	}

	private async _onItemPreSave({ mutable, catalog }: ItemPreSaveEventArgs) {
		if (!mutable?.props?.properties) return;
		const normalized = normalizeArticleProperties(mutable.props.properties, catalog.props.properties);
		if (!normalized?.length) delete mutable?.props?.properties;
		else mutable.props.properties = normalized;
	}
}
