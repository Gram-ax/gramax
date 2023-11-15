import GroupsName from "@components/HomePage/Groups/model/GroupsName";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import { Catalog } from "../../../../../logic/FileStructue/Catalog/Catalog";
import { Category } from "../../../../../logic/FileStructue/Category/Category";
import { Item, ItemType } from "../../../../../logic/FileStructue/Item/Item";
import { ArticleLink, CatalogLink, CategoryLink, ItemLink, TitledLink } from "../../../NavigationLinks";

export type NavigationCatalogFilter = (entry: CatalogEntry, link: CatalogLink) => boolean;
export type NavigationItemFilter = (entry: Catalog, item: Item, link: ItemLink) => boolean;
export type NavigationRelatedLinkFilter = (entry: Catalog, related: TitledLink) => boolean;

export default class Navigation {
	private _catalogFilter: NavigationCatalogFilter[] = [];
	private _itemFilter: NavigationItemFilter[] = [];
	private _relatedLinkFilter: NavigationRelatedLinkFilter[] = [];

	addRules(filters: {
		catalogFilter?: NavigationCatalogFilter;
		itemFilter?: NavigationItemFilter;
		relatedLinkFilter?: NavigationRelatedLinkFilter;
	}) {
		if (filters.catalogFilter) this._catalogFilter.push(filters.catalogFilter);
		if (filters.itemFilter) this._itemFilter.push(filters.itemFilter);
		if (filters.relatedLinkFilter) this._relatedLinkFilter.push(filters.relatedLinkFilter);
	}

	getCatalogsLink(catalogs: Map<string, CatalogEntry>): CatalogLink[] {
		return Array.from(catalogs.entries())
			.map(([name, catalog]) => this.getCatalogLink(catalog, name))
			.filter((c) => c)
			.sort((a, b) => a.order - b.order);
	}

	getRelatedLinks(catalog: Catalog): TitledLink[] {
		const relatedLinks: TitledLink[] = catalog.getProp("relatedLinks") ?? null;
		if (!relatedLinks) return relatedLinks;
		if (this._relatedLinkFilter.length == 0) return relatedLinks;
		const newRelatedLinks: TitledLink[] = [];
		relatedLinks.forEach((relatedLink) => {
			this._relatedLinkFilter.forEach((rule) => {
				if (rule(catalog, relatedLink))
					if (!newRelatedLinks.includes(relatedLink)) newRelatedLinks.push(relatedLink);
			});
		});

		return newRelatedLinks;
	}

	getCatalogLink(catalog: CatalogEntry, name?: string): CatalogLink {
		if (!catalog) return null;
		if (!name) name = catalog.name;
		const catalogLink: CatalogLink = {
			name: name,
			pathname: name,
			logo: catalog.props[navProps.logo] ?? null,
			title: catalog.props[navProps.title] ?? name,
			query: {},
			group: catalog.props[navProps.group] ?? GroupsName.company,
			code: catalog.props[navProps.code] ?? catalog.props[navProps.title] ?? name,
			style: catalog.props[navProps.style] ?? null,
			brand: catalog.props[navProps.brand] ?? null,
			description: catalog.props[navProps.description] ?? null,
			order: catalog.props[navProps.order] ?? 999999,
		};

		return this._catalogFilter.every((rule) => rule(catalog, catalogLink)) ? catalogLink : null;
	}

	async getCatalogNav(catalog: Catalog, currentItemLogicPath: string): Promise<ItemLink[]> {
		const items = await catalog.getTransformedItems<ItemLink>((i: Item) =>
			this._toItemLink(catalog, i, currentItemLogicPath),
		);
		return items;
	}

	private async _toItemLink(catalog: Catalog, item: Item, currentItemLogicPath: string): Promise<ItemLink> {
		const itemLink: ItemLink = {
			ref: { path: item.ref.path.value, storageId: item.ref.storageId },
			icon: item.props[navProps.icon] ?? null,
			title: item.props[navProps.title] ?? item.ref.path.name,
			type: null,
			pathname: item.logicPath,
			query: {},
			isCurrentLink: item.logicPath === currentItemLogicPath,
		};
		if (item.type == "article") {
			itemLink.type = ItemType.article;
			(<ArticleLink>itemLink).alwaysShow = item.props["alwaysShow"] ?? null;
		} else {
			if ((<Category>item).items.length == 0 && !(item as Category).content) return null;
			itemLink.type = ItemType.category;
			const categoryLink = itemLink as CategoryLink;
			if ((item as Category).content) {
				categoryLink.isCurrentLink = item.logicPath === currentItemLogicPath;
				categoryLink.existContent = true;
			}
			categoryLink.isExpanded =
				currentItemLogicPath.includes(categoryLink.pathname) ||
				catalog.getRootCategoryPath().compare(item.parent.folderPath);

			categoryLink.items = [];
			categoryLink.existContent = !!(item as Category).content;
			const categoryItems = [];
			const notIndexArticleRules = this._itemFilter.filter((rule) => !(rule as any).isIndexRule);
			for (const i of (<Category>item).items) {
				const link = await this._toItemLink(catalog, i, currentItemLogicPath);
				if (link) categoryLink.items.push(link);
				if (notIndexArticleRules.every((rule) => rule(catalog, i, itemLink)) && i.type == "article")
					categoryItems.push(i);
			}
			if (categoryLink.items.length == 0 && categoryItems.length == 0 && !categoryLink.existContent) return null;
			categoryLink.filter = item.props["filter"] ?? null;
		}
		for (const rule of this._itemFilter) if (!rule(catalog, item, itemLink)) return null;
		return itemLink;
	}
}

export enum navProps {
	brand = "brand",
	icon = "icon",
	code = "code",
	logo = "logo",
	order = "order",
	title = "title",
	style = "style",
	group = "group",
	description = "description",
}
