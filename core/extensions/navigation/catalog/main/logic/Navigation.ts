import Path from "@core/FileProvider/Path/Path";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type LastVisited from "@core/SitePresenter/LastVisited";
import { Catalog } from "../../../../../logic/FileStructue/Catalog/Catalog";
import { Category } from "../../../../../logic/FileStructue/Category/Category";
import { Item } from "../../../../../logic/FileStructue/Item/Item";
import { ArticleLink, CatalogLink, CategoryLink, ItemLink, TitledLink } from "../../../NavigationLinks";

type NavItemRule = (entry: Catalog, item: Item, link: ItemLink) => boolean;
type NavCatalogRule = (entry: CatalogEntry, link: CatalogLink) => boolean;
type NavRelatedLinkRule = (entry: Catalog, related: TitledLink) => boolean;

export interface NavRules {
	itemRule?: NavItemRule;
	catalogRule?: NavCatalogRule;
	relatedLinkRule?: NavRelatedLinkRule;
}

export default class Navigation {
	private _itemFilter: NavItemRule[] = [];
	private _catalogFilter: NavCatalogRule[] = [];
	private _relatedLinkFilter: NavRelatedLinkRule[] = [];

	addRules(rules: NavRules) {
		if (rules.itemRule) this._itemFilter.push(rules.itemRule);
		if (rules.catalogRule) this._catalogFilter.push(rules.catalogRule);
		if (rules.relatedLinkRule) this._relatedLinkFilter.push(rules.relatedLinkRule);
	}

	async getCatalogsLink(catalogs: Map<string, CatalogEntry>, lastVisited?: LastVisited): Promise<CatalogLink[]> {
		const catalogLinks = await Promise.all(
			Array.from(catalogs.entries()).map(async ([, catalog]) => await this.getCatalogLink(catalog, lastVisited)),
		);
		return catalogLinks
			.filter((c) => c)
			.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "variant", ignorePunctuation: true }))
			.sort((a, b) => a.order - b.order);
	}

	getRelatedLinks(catalog: Catalog): TitledLink[] {
		const relatedLinks = catalog.props.relatedLinks ?? null;
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

	async getCatalogLink(catalog: CatalogEntry, lastVisited?: LastVisited): Promise<CatalogLink> {
		if (!catalog) return null;
		const name = catalog.getName();
		const catalogLink: CatalogLink = {
			name,
			pathname: lastVisited?.getLastVisitedArticle(catalog) ?? (await catalog.getPathname()),
			logo: catalog.props[navProps.logo] ?? null,
			title: catalog.props[navProps.title] ?? name,
			query: {},
			group: catalog.props[navProps.group] ?? null,
			code: catalog.props[navProps.code] ?? "",
			style: catalog.props[navProps.style] ?? null,
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
			title: item.getTitle() ?? item.ref.path.name,
			type: null,
			pathname: await catalog.getPathname(item),
			query: {},
			isCurrentLink: item.logicPath === currentItemLogicPath,
		};
		if (item.type === ItemType.article) {
			itemLink.type = ItemType.article;
			(<ArticleLink>itemLink).alwaysShow = item.props["alwaysShow"] ?? null;
		} else {
			itemLink.type = ItemType.category;
			const categoryLink = itemLink as CategoryLink;
			categoryLink.items = [];
			categoryLink.existContent = true;
			categoryLink.isCurrentLink = item.logicPath === currentItemLogicPath;
			const cataegoryLinkItemLogicPath = new Path(
				RouterPathProvider.parsePath(new Path(categoryLink.pathname)).itemLogicPath,
			).value;

			categoryLink.isExpanded =
				currentItemLogicPath.includes(cataegoryLinkItemLogicPath) ||
				catalog.getRootCategoryPath().compare(item.parent.folderPath);

			for (const i of (<Category>item).items) {
				const link = await this._toItemLink(catalog, i, currentItemLogicPath);
				if (link) categoryLink.items.push(link);
			}
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
