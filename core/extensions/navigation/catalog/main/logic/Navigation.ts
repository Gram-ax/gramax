import { createEventEmitter, Event, type HasEvents } from "@core/Event/EventEmitter";
import Path from "@core/FileProvider/Path/Path";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type LastVisited from "@core/SitePresenter/LastVisited";
import type { ClientItemRef } from "@core/SitePresenter/SitePresenter";
import { Catalog } from "../../../../../logic/FileStructue/Catalog/Catalog";
import { Category } from "../../../../../logic/FileStructue/Category/Category";
import { Item } from "../../../../../logic/FileStructue/Item/Item";
import { ArticleLink, CatalogLink, CategoryLink, ItemLink, TitledLink } from "../../../NavigationLinks";

export type NavigationEvents = Event<"before-build-nav-tree", { catalog: Catalog; mutableRoot: { root: Category } }> &
	Event<
		"built-nav-tree",
		{ catalog: Catalog; getRootNav: () => Promise<ItemLink[]>; mutableTree: { tree: ItemLink[] } }
	> &
	Event<"filter-item", { catalog: Catalog; item: Item; link: ItemLink }> &
	Event<"filter-catalog", { entry: CatalogEntry; link: CatalogLink }> &
	Event<"filter-related-links", { catalog: Catalog; mutableLinks: { links: TitledLink[] } }> &
	Event<"resolve-root-category", { catalog: Catalog; mutableRef: { ref: ClientItemRef } }>;

export default class Navigation implements HasEvents<NavigationEvents> {
	private _events = createEventEmitter<NavigationEvents>();

	get events() {
		return this._events;
	}

	async getCatalogsLink(
		catalogs: CatalogEntry[],
		lastVisited?: LastVisited,
		filter: (catalog: CatalogEntry) => boolean = () => true,
	): Promise<CatalogLink[]> {
		const catalogLinks = await Promise.all(
			catalogs.filter(filter).map(async (catalog) => await this.getCatalogLink(catalog, lastVisited)),
		);
		return catalogLinks
			.filter((c) => c)
			.sort((a, b) =>
				a.title.localeCompare(b.title, undefined, { sensitivity: "variant", ignorePunctuation: true }),
			)
			.sort((a, b) => a.order - b.order);
	}

	async getRelatedLinks(catalog: Catalog): Promise<TitledLink[]> {
		const relatedLinks = catalog.props.relatedLinks || [];
		const args = { catalog, mutableLinks: { links: relatedLinks } };
		await this._events.emit("filter-related-links", args);
		return args.mutableLinks.links;
	}

	async getCatalogLink(catalog: CatalogEntry, lastVisited?: LastVisited): Promise<CatalogLink> {
		if (!catalog) return null;

		const link: CatalogLink = {
			name: catalog.getName(),
			pathname: lastVisited?.getLastVisitedArticle(catalog) || (await catalog.getPathname()),
			logo: catalog.props[navProps.logo] ?? null,
			title: catalog.props[navProps.title] ?? catalog.getName(),
			query: {},
			group: catalog.props[navProps.group] ?? null,
			code: catalog.props[navProps.code] ?? "",
			style: catalog.props[navProps.style] ?? null,
			description: catalog.props[navProps.description] ?? null,
			order: catalog.props[navProps.order] ?? 999999,
		};

		const filter = await this.events.emit("filter-catalog", { entry: catalog, link });
		return filter ? link : null;
	}

	async getCatalogNav(catalog: Catalog, currentItemLogicPath: string): Promise<ItemLink[]> {
		const parts = currentItemLogicPath.split("/");
		const currentItemLogicPaths = parts.map((_, index) => parts.slice(0, index + 1).join("/"));

		const mutableRoot = { root: catalog.getRootCategory() };
		await this.events.emit("before-build-nav-tree", { catalog, mutableRoot });

		const items = await catalog.getTransformedItems<ItemLink>(mutableRoot.root, (i: Item) =>
			this._convertToItemLink(catalog, i, currentItemLogicPaths),
		);

		const mutableTree = { tree: items };
		await this.events.emit("built-nav-tree", {
			catalog,
			getRootNav: () =>
				catalog.getTransformedItems<ItemLink>(catalog.getRootCategory(), (i) =>
					this._convertToItemLink(catalog, i, currentItemLogicPaths),
				),
			mutableTree,
		});
		return mutableTree.tree;
	}

	async getRootItemLink(catalog: Catalog): Promise<ClientItemRef> {
		const mutableRef = { ref: null };
		await this.events.emit("resolve-root-category", { catalog, mutableRef });
		return mutableRef.ref;
	}

	private async _convertToItemLink(catalog: Catalog, item: Item, currentItemLogicPaths: string[]): Promise<ItemLink> {
		const link: ItemLink = {
			ref: { path: item.ref.path.value, storageId: item.ref.storageId },
			icon: item.props[navProps.icon] ?? null,
			title: item.getTitle() ?? item.ref.path.name,
			type: null,
			pathname: await catalog.getPathname(item),
			external: item.props.external ?? null,
			query: {},
			isCurrentLink: item.logicPath === currentItemLogicPaths[currentItemLogicPaths.length - 1],
		};

		if (item.type === ItemType.category) {
			link.type = ItemType.category;
			const categoryLink = link as CategoryLink;
			categoryLink.items = [];
			categoryLink.existContent = true;
			const cataegoryLinkItemLogicPath = RouterPathProvider.isEditorPathname(new Path(categoryLink.pathname))
				? new Path(RouterPathProvider.parsePath(new Path(categoryLink.pathname)).itemLogicPath).value
				: categoryLink.pathname;
			categoryLink.isExpanded =
				currentItemLogicPaths.some((part) => part === cataegoryLinkItemLogicPath) ||
				catalog.getRootCategoryPath().compare(item.parent.folderPath);

			for (const i of (<Category>item).items) {
				const link = await this._convertToItemLink(catalog, i, currentItemLogicPaths);
				if (link) categoryLink.items.push(link);
			}

			categoryLink.filter = item.props["filter"] ?? null;
		}

		if (item.type == ItemType.article) {
			link.type = ItemType.article;
			(<ArticleLink>link).alwaysShow = item.props["alwaysShow"] ?? null;
		}

		const filter = await this._events.emit("filter-item", { catalog, item, link });
		return filter ? link : null;
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
