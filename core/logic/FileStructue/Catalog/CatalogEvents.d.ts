import type { Event } from "@core/Event/EventEmitter";
import type ArticleParser from "@core/FileStructue/Article/ArticleParser";
import type Catalog from "@core/FileStructue/Catalog/Catalog2";
import type { Category } from "@core/FileStructue/Category/Category";
import type { Item, UpdateItemProps } from "@core/FileStructue/Item/Item";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type { MakeResourceUpdater } from "@core/Resource/ResourceUpdaterFactory";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { ItemRefStatus, ItemStatus } from "@ext/Watchers/model/ItemStatus";

export type CatalogItemsUpdated = {
	catalog: Catalog;
	items: ItemStatus[];
};

export type CatalogFilesUpdated = {
	catalog: Catalog;
	items: ItemRefStatus[];
};

type CatalogEvents = Event<"update", { catalog: Catalog }> &
	Event<"item-order-updated", { catalog: Catalog; item: Item }> &
	Event<"resolve-category", { catalog: Catalog; mutableCategory: { category: Category } }> &
	Event<"files-changed", CatalogFilesUpdated> &
	Event<"before-set-name", { catalog: Catalog; mutableName: { name: string } }> &
	Event<"set-name", { catalog: Catalog; prev: string }> &
	Event<
		"item-moved",
		{
			catalog: Catalog;
			from: ItemRef;
			to: ItemRef;
			makeResourceUpdater: MakeResourceUpdater;
			rp?: RepositoryProvider;
			innerRefs: ItemRef[];
		}
	> &
	Event<"item-deleted", { catalog: Catalog; ref: ItemRef; parser?: ArticleParser }> &
	Event<"item-created", { catalog: Catalog; makeResourceUpdater: MakeResourceUpdater; parentRef?: ItemRef }> &
	Event<
		"item-props-updated",
		{
			catalog: Catalog;
			item: Item;
			ref: ItemRef;
			props: UpdateItemProps;
			makeResourceUpdater: MakeResourceUpdater;
		}
	>;

export default CatalogEvents;
