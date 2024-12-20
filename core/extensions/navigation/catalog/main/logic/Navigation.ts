import { createEventEmitter, Event, type HasEvents } from "@core/Event/EventEmitter";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type LastVisited from "@core/SitePresenter/LastVisited";
import type { ClientItemRef } from "@core/SitePresenter/SitePresenter";
import { Category } from "../../../../../logic/FileStructue/Category/Category";
import { Item } from "../../../../../logic/FileStructue/Item/Item";
import { ArticleLink, CatalogLink, CategoryLink, ItemLink, TitledLink } from "../../../NavigationLinks";
import type { ReadonlyBaseCatalog, ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import Path from "@core/FileProvider/Path/Path";

export type NavigationEvents = Event<
	"before-build-nav-tree",
	{ catalog: ReadonlyCatalog; mutableRoot: { root: Category } }
> &
	Event<
		"built-nav-tree",
		{
			catalog: ReadonlyCatalog;
			mutableTree: { tree: ItemLink[] };
			currentItemPath: string;
			metadata: NavTreeMetadata;
		}
	> &
	Event<"filter-item", { catalog: ReadonlyCatalog; item: Item; link: ItemLink }> &
	Event<"filter-catalog", { entry: ReadonlyBaseCatalog; link: CatalogLink }> &
	Event<"filter-related-links", { catalog: ReadonlyBaseCatalog; mutableLinks: { links: TitledLink[] } }> &
	Event<"resolve-root-category", { catalog: ReadonlyCatalog; mutableRef: { ref: ClientItemRef } }>;

export type NavTreeMetadata = { [path: string]: WeakRef<Item> };

export default class Navigation implements HasEvents<NavigationEvents> {
	private _events = createEventEmitter<NavigationEvents>();

	get events() {
		return this._events;
	}

	async getCatalogsLink(
		catalogs: BaseCatalog[],
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

	async getRelatedLinks(catalog: ReadonlyBaseCatalog): Promise<TitledLink[]> {
		const relatedLinks = catalog.props.relatedLinks || [];
		const args = { catalog, mutableLinks: { links: relatedLinks } };
		await this._events.emit("filter-related-links", args);
		return args.mutableLinks.links;
	}

	async getCatalogLink(catalog: ReadonlyBaseCatalog, lastVisited?: LastVisited): Promise<CatalogLink> {
		if (!catalog) return null;

		const link: CatalogLink = {
			name: catalog.name,
			pathname: lastVisited?.getLastVisitedArticle(catalog) || (await catalog.getPathname()),
			logo: catalog.props[navProps.logo] ?? null,
			title: catalog.props[navProps.title] ?? catalog.name,
			query: {},
			group: catalog.props[navProps.group] ?? null,
			code: catalog.props[navProps.code] ?? "",
			style: catalog.props[navProps.style] ?? null,
			description: catalog.props[navProps.description] ?? null,
			order: catalog.props[navProps.order] ?? 999999,
			isCloning: catalog.props?.isCloning ?? false,
		};

		const filter = await this.events.emit("filter-catalog", { entry: catalog, link });
		return filter ? link : null;
	}

	async getCatalogNav(catalog: ReadonlyCatalog, currentItemPath: string): Promise<ItemLink[]> {
		const parts = currentItemPath.split("/");
		const currentPaths = parts.map((_, index) => parts.slice(0, index + 1).join("/"));

		const mutableRoot = { root: catalog.getRootCategory() };
		await this.events.emit("before-build-nav-tree", { catalog, mutableRoot });

		const metadata: NavTreeMetadata = {};

		const items = await catalog.deref.getTransformedItems<ItemLink>(mutableRoot.root, (i: Item) =>
			this._convertToItemLink(catalog, i, currentPaths, metadata),
		);

		const mutableTree = { tree: items };
		await this.events.emit("built-nav-tree", {
			catalog,
			currentItemPath,
			mutableTree,
			metadata,
		});
		return mutableTree.tree;
	}

	async getRootItemLink(catalog: ReadonlyCatalog): Promise<ClientItemRef> {
		const mutableRef = { ref: null };
		await this.events.emit("resolve-root-category", { catalog, mutableRef });
		return mutableRef.ref;
	}

	private async _convertToItemLink(
		catalog: ReadonlyCatalog,
		item: Item,
		currentItemPaths: string[],
		metadata: NavTreeMetadata,
	): Promise<ItemLink> {
		const link: ItemLink = {
			ref: { path: item.ref.path.value, storageId: item.ref.storageId },
			icon: item.props[navProps.icon] ?? null,
			title: item.getTitle() ?? item.ref.path.name,
			type: null,
			pathname: await catalog.getPathname(item),
			external: item.props.external ?? null,
			query: {},
			isCurrentLink: item.ref.path.value === currentItemPaths[currentItemPaths.length - 1],
		};

		if (item.type === ItemType.category) {
			link.type = ItemType.category;
			const categoryLink = link as CategoryLink;
			categoryLink.items = [];
			categoryLink.existContent = true;
			categoryLink.isExpanded =
				currentItemPaths.some((part) => part === new Path(categoryLink.ref.path).parentDirectoryPath.value) ||
				catalog.getRootCategoryPath().compare(item.parent.folderPath);

			for (const i of (<Category>item).items) {
				const link = await this._convertToItemLink(catalog, i, currentItemPaths, metadata);
				if (link) categoryLink.items.push(link);
			}

			categoryLink.filter = item.props["filter"] ?? null;
		}

		if (item.type == ItemType.article) {
			link.type = ItemType.article;
			(<ArticleLink>link).alwaysShow = item.props["alwaysShow"] ?? null;
		}

		if (await this._events.emit("filter-item", { catalog, item, link })) {
			metadata[link.pathname] = new WeakRef(item);
			return link;
		}
		return null;
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
