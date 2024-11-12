import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import FileStructure from "@core/FileStructue/FileStructure";
import type { MakeResourceUpdater } from "@core/Resource/ResourceUpdaterFactory";
import itemRefUtils from "@core/utils/itemRefUtils";
import { ItemStatus, type ItemRefStatus } from "@ext/Watchers/model/ItemStatus";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import type { RefInfo } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type Repository from "@ext/git/core/Repository/Repository";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { CatalogErrors } from "@ext/healthcheck/logic/Healthcheck";
import type { FSLocalizationProps } from "@ext/localization/core/events/FSLocalizationEvents";
import IconProvider from "@ext/markdown/elements/icon/logic/IconProvider";
import SnippetProvider from "@ext/markdown/elements/snippet/logic/SnippetProvider";
import TabsTags from "@ext/markdown/elements/tabs/model/TabsTags";
import type { TitledLink } from "@ext/navigation/NavigationLinks";
import { Property, SystemProperties } from "@ext/properties/models";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import { FileStatus } from "../../../extensions/Watchers/model/FileStatus";
import IPermission from "../../../extensions/security/logic/Permission/IPermission";
import Path from "../../FileProvider/Path/Path";
import FileProvider from "../../FileProvider/model/FileProvider";
import { Article } from "../Article/Article";
import { Category } from "../Category/Category";
import { Item, UpdateItemProps } from "../Item/Item";
import { ItemRef } from "../Item/ItemRef";
import { ItemType } from "../Item/ItemType";

export type CatalogEvents = Event<"update", { catalog: Catalog }> &
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

export type CatalogItemsUpdated = {
	catalog: Catalog;
	items: ItemStatus[];
};

export type CatalogFilesUpdated = {
	catalog: Catalog;
	items: ItemRefStatus[];
};

export type ItemFilter = ((item: Item, catalog: Catalog) => boolean) & {
	getErrorArticle?: (pathname: string) => Article;
};
export type ArticleFilter = (article: Article, catalog: Catalog) => boolean;
export type CategoryFilter = (category: Category, catalog: Catalog) => boolean;

export type CatalogInitProps = {
	name: string;
	props: CatalogProps;
	root: Category;
	basePath: Path;
	rootPath: Path;
	errors: CatalogErrors;
	isReadOnly: boolean;

	fp: FileProvider;
	fs: FileStructure;
};

export type CatalogProps = FSLocalizationProps & {
	title?: string;
	description?: string;
	url?: string;
	docroot?: string;
	readOnly?: boolean;
	tabsTags?: TabsTags;
	contactEmail?: string;
	properties?: Property[];
	versions?: string[];

	relatedLinks?: TitledLink[];
	private?: string[];
	hidden?: boolean;
	refs?: string[];

	sharePointDirectory?: string;

	isCloning?: boolean;
	resolvedVersions?: RefInfo[];
	resolvedVersion?: RefInfo;
};

export const EXCLUDED_PROPS = ["url", "docroot", "resolvedVersions", "resolvedVersion"];

export class Catalog extends CatalogEntry {
	protected _rootCategory: Category;
	protected _rootPath: Path;
	protected _fp: FileProvider;
	protected _fs: FileStructure;

	private _snippetProvider: SnippetProvider;
	private _iconProvider: IconProvider;
	private _events = createEventEmitter<CatalogEvents>();

	private _headVersion: Catalog;

	protected declare _repo: Repository;

	constructor(init: CatalogInitProps) {
		super({
			name: init.name,
			rootCaterogyRef: init.root.ref,
			basePath: init.basePath,
			props: init.props,
			errors: init.errors,
			load: null,
			isReadOnly: init.isReadOnly,
		});

		this._props = init.props;
		this._rootCategory = init.root;
		this._basePath = init.basePath;
		this._errors = init.errors;
		this._rootPath = init.rootPath;
		this._name = init.name;
		this._fp = init.fp;
		this._fs = init.fs;

		for (const item of this.getItems()) {
			item.events.on("item-changed", this._onItemChanged.bind(this));
			item.events.on(
				"item-order-updated",
				async (args) => await this.events.emit("item-order-updated", { catalog: this, ...args }),
			);
		}

		this._snippetProvider = new SnippetProvider(this._fp, this._fs, this);

		this._iconProvider = new IconProvider(this._fp, this._fs, this);
	}

	get events() {
		return this._events;
	}

	load() {
		return Promise.resolve(this);
	}

	getName(): string {
		return this._name;
	}

	get snippetProvider() {
		return this._snippetProvider;
	}

	get iconProvider() {
		return this._iconProvider;
	}

	get repo() {
		return this._repo;
	}

	setRepo(repo: Repository, rp: RepositoryProvider) {
		super.setRepo(repo, rp);
		if (!this._repo.gvc) return;
		this._repo.gvc.events.on("files-changed", async ({ items }) => {
			await this.update();

			await this._onFileChanged(
				items.map((item) => ({
					ref: this._fp.getItemRef(item.path),
					status: item.status,
				})),
			);
		});
	}

	async getHeadVersion(): Promise<Catalog> {
		if (!this._headVersion) {
			if (!this.repo.gvc) return null;
			const headPath = GitTreeFileProvider.scoped(this._basePath, null);
			this._headVersion = await this._fs.getCatalogByPath(headPath);
		}
		return this._headVersion;
	}

	getRelativeRepPath(ref: Path | ItemRef): Path {
		return ref instanceof Path
			? this._basePath.subDirectory(ref)?.removeExtraSymbols // TODO: remove `?`
			: this._basePath.subDirectory(ref.path)?.removeExtraSymbols; // TODO: remove `?`
	}

	getItemRefPath(relativeRepPath: Path): Path {
		return this._basePath.join(relativeRepPath);
	}

	getBasePath(): Path {
		return this._basePath;
	}

	async deleteItem(ref: ItemRef, parser?: ArticleParser, silent?: boolean) {
		await this._deleteItem(ref, parser);
		if (!silent) await this.events.emit("item-deleted", { catalog: this, ref, parser });
	}

	async createArticle(
		makeResourceUpdater: MakeResourceUpdater,
		markdown: string,
		parentRef?: ItemRef,
		silent?: boolean,
	): Promise<Article> {
		const parentItem = parentRef
			? this.findItemByItemRef<Category>(parentRef) ?? this._resolveRootCategory()
			: this._resolveRootCategory();

		if (parentItem.type == ItemType.article) {
			const category = await this.createCategoryByArticle(makeResourceUpdater, parentItem as Article);
			if (!silent) await this.events.emit("item-created", { catalog: this, makeResourceUpdater, parentRef });
			return await this.createArticle(makeResourceUpdater, markdown, category.ref, true);
		}

		const ref: ItemRef = itemRefUtils.create(
			parentItem.ref,
			parentItem.items.map((i) => i.ref),
		);

		await this._fp.write(ref.path, markdown);
		const article = await this._fs.createArticle(ref.path, parentItem, this._props, this._errors);
		await article.setLastPosition();
		parentItem.items.push(article);
		article.events.on("item-changed", this._onItemChanged.bind(this));
		article.events.on(
			"item-order-updated",
			async (args) => await this.events.emit("item-order-updated", { catalog: this, ...args }),
		);

		await this._onItemChanged({ item: article, status: FileStatus.new });
		if (!silent) await this.events.emit("item-created", { catalog: this, makeResourceUpdater, parentRef });
		return article;
	}

	async createCategory(name: string, parentRef?: ItemRef): Promise<Category> {
		const parentItem = parentRef
			? this.findItemByItemRef<Category>(parentRef) ?? this._resolveRootCategory()
			: this._resolveRootCategory();

		if (parentItem.type == ItemType.article)
			throw new Error(`Cannot create category: parent item is article; ref: ${parentItem.ref.path.value}`);

		const category = await this._fs.createCategory(
			parentItem.folderPath.join(new Path([name, CATEGORY_ROOT_FILENAME])),
			parentItem,
			null,
			this._props,
			this._errors,
		);

		category.events.on("item-changed", this._onItemChanged.bind(this));
		category.events.on(
			"item-order-updated",
			async (args) => await this.events.emit("item-order-updated", { catalog: this, ...args }),
		);
		await this._onItemChanged({ item: category, status: FileStatus.new });
		return category;
	}

	async update() {
		const arg = { catalog: this };
		await this.events.emit("update", arg);
		this._update(arg.catalog);
	}

	async updateItemProps(props: UpdateItemProps, makeResourceUpdater: MakeResourceUpdater) {
		const item: Item = this.findArticle(props.logicPath, []);
		if (!item) return;
		const ref = { ...item.ref };
		await item.updateProps(props, makeResourceUpdater(this), this._resolveRootCategory().props);
		await this.events.emit("item-props-updated", { catalog: this, ref, item, props, makeResourceUpdater });
		return item;
	}

	getNeededPermission(): IPermission {
		return this._rootCategory.neededPermission;
	}

	async updateNeededPermission(permission: IPermission) {
		await this._rootCategory.setNeededPermission(permission);
		this._props.private = this._rootCategory.neededPermission.getValues();
		await this._fs.saveCatalog(this);
	}

	async updateProps(makeResourceUpdater: MakeResourceUpdater, props: CatalogEditProps | CatalogProps) {
		const newProps = {
			...props,
			properties: props?.properties?.filter((property) => !SystemProperties[property.name.toLowerCase()]),
		};
		Object.keys(newProps)
			.filter((k) => !EXCLUDED_PROPS.includes(k))
			.forEach((k) => (this._props[k] = newProps[k]));
		await this._fs.saveCatalog(this);
		if (props.docroot) await this._moveRootCategoryIfNeed(new Path(props.docroot), makeResourceUpdater);
		await this.update();
		if (props.url && props.url !== this._name) return this.updateName(props.url);
		return this;
	}

	async updateName(name: string) {
		const mutableName = { name };
		const prev = this._name;
		await this.events.emit("before-set-name", { catalog: this, mutableName });

		const newBasePath = this._basePath.getNewName(mutableName.name);
		await this._fp.move(this._basePath, newBasePath);
		this._basePath = newBasePath;
		await this.update();

		await this.events.emit("set-name", { catalog: this, prev });

		return this;
	}

	async getTransformedItems<T>(root: Category, transformer: (item: Item) => Promise<T> | T): Promise<T[]> {
		const transformedItems: T[] = [];
		for (const item of root.items) transformedItems.push(await transformer(item));
		const items = transformedItems.filter((l) => l);
		return items;
	}

	findItemByItemPath<T extends Item = Item>(itemPath: Path): T {
		return this._findItem(this._resolveRootCategory(), [], [(a) => a.ref.path.compare(itemPath)]) as T;
	}

	findItemByItemRef<T extends Item = Item>(itemRef: ItemRef): T {
		return this._findItem(this._resolveRootCategory(), [], [(a) => a.ref.path.compare(itemRef.path)]) as T;
	}

	findArticleByItemRef(itemRef: ItemRef): Article {
		return this._findItem(
			this._resolveRootCategory(),
			[],
			[(a) => a.ref.path.compare(itemRef.path) && a.type === ItemType.article],
		) as Article;
	}

	findCategoryByItemRef(itemRef: ItemRef): Category {
		return this._findItem(
			this._resolveRootCategory(),
			[],
			[(a) => a.ref.path.compare(itemRef.path) && a.type === ItemType.category],
		) as Category;
	}

	findArticle(logicPath: string, filters: ArticleFilter[], root?: Category): Article {
		const item = this._findItemByLogicPath(root || this._resolveRootCategory(), logicPath, filters);
		if (!item) return null;
		if (item.type === ItemType.category && (item as Category).parent) return item as Article;
		if (item.type === ItemType.article) return item as Article;
		return this._findItem(item as Category, filters, [(a) => typeof a.content === "string"]) as Article;
	}

	getRootCategory(): Category {
		return this._rootCategory;
	}

	getRootCategoryRef(): ItemRef {
		return this._rootCategory.ref;
	}

	getRootCategoryPath(): Path {
		return this._rootCategory.folderPath;
	}

	getRelativeRootCategoryPath(): Path {
		const root = this.getRootCategoryPath();
		return root.rootDirectory?.subDirectory(root);
	}

	getItems(filters: ArticleFilter[] = [], root?: Category): Item[] {
		return this._getItems(root || this._resolveRootCategory(), filters);
	}

	getArticles(filters?: ArticleFilter[]): Article[] {
		if (!filters) filters = [];
		filters.push((item: Item) => item.type == ItemType.article);
		return this._getItems(this._resolveRootCategory(), filters) as Article[];
	}

	getCategories(filters?: CategoryFilter[]): Category[] {
		if (!filters) filters = [];
		filters.push((item: Item) => item.type == ItemType.category);
		const root = this._resolveRootCategory();
		return [root, ...(this._getItems(root, filters) as Category[])];
	}

	getContentItems(filters?: ArticleFilter[]): Article[] {
		if (!filters) filters = [];
		filters.push((article: Article) => !!article.content);
		return this._getItems(this._resolveRootCategory(), filters) as Article[];
	}

	async moveItem(
		from: ItemRef,
		to: ItemRef,
		makeResourceUpdater: MakeResourceUpdater,
		innerRefs?: ItemRef[],
		silent?: boolean,
	) {
		const item = this.findItemByItemRef<Article>(from);
		if (!item) throw new Error(`Item '${from.path.value}' wasn't found in catalog ${this._basePath.value}`);

		if (item.type == ItemType.category)
			await this._moveCategoryItems(<Category>item, to, makeResourceUpdater, innerRefs);

		const movedItem = await this._moveArticleItem(item, to);

		const resourceUpdater = makeResourceUpdater(this);
		await resourceUpdater.update(item, movedItem, innerRefs);

		if (!silent) await this.events.emit("item-moved", { catalog: this, from, to, makeResourceUpdater, innerRefs });

		await resourceUpdater.updateOtherArticles(from.path, to.path, innerRefs);
	}

	async createCategoryByArticle(makeResourceUpdater: MakeResourceUpdater, parentArticle: Article): Promise<Category> {
		const dir = parentArticle.ref.path.parentDirectoryPath.join(new Path(parentArticle.getFileName()));
		const path = dir.join(new Path(CATEGORY_ROOT_FILENAME));

		const index = parentArticle.parent.items.findIndex((i) => i.ref.path.compare(parentArticle.ref.path));
		await this._deleteItem(parentArticle.ref);
		if (index === -1 || parentArticle.type == ItemType.category) return parentArticle as Category;

		const category = await this._fs.createCategory(
			path,
			parentArticle.parent,
			parentArticle,
			this._props,
			this._errors,
		);

		await makeResourceUpdater(this).update(parentArticle, category);
		category.events.on("item-changed", this._onItemChanged.bind(this));
		category.events.on(
			"item-order-updated",
			async (args) => await this.events.emit("item-order-updated", { catalog: this, ...args }),
		);
		parentArticle.parent.items.splice(index, 0, category);
		await this._onItemChanged({ item: category, status: FileStatus.new });
		return category;
	}

	private _resolveRootCategory() {
		return this._rootCategory;
	}

	private async _moveArticleItem(item: Article, to: ItemRef) {
		await this._fp.move(item.ref.path, to.path);

		const movedItem =
			item.type == ItemType.category
				? await this._fs.makeCategory(
						to.path.parentDirectoryPath,
						this._rootCategory,
						this.props,
						this.errors,
						to.path,
				  )
				: await this._fs.createArticle(to.path, this._rootCategory, this.props, this.errors);

		return movedItem;
	}

	private async _moveCategoryItems(
		item: Category,
		to: ItemRef,
		makeResourceUpdater: MakeResourceUpdater,
		innerRefs: ItemRef[],
	) {
		for (const i of item.items) {
			const childNewBasePath = to.path.parentDirectoryPath.join(
				item.ref.path.parentDirectoryPath.subDirectory(i.ref.path),
			);
			const childNewItemRef = { path: childNewBasePath, storageId: i.ref.storageId };
			await this.moveItem(i.ref, childNewItemRef, makeResourceUpdater, innerRefs, true);
		}
	}

	protected async _deleteItem(ref: ItemRef, parser?: ArticleParser) {
		const item = this.findItemByItemRef<Article>(ref);
		if (!item) return;

		const index = item.parent.items.findIndex((i) => i.ref.path.compare(item?.ref?.path));
		if (index == -1) return;
		item.parent.items.splice(index, 1);

		if (await this._fp.exists(item.ref.path)) {
			if (item.content && parser) {
				await parser.parse(item, this);
				await item.parsedContent.resourceManager.deleteAll();
			}

			if (item.type == ItemType.category) {
				const items = this._getItems(item as Category);
				if (parser) {
					await Promise.all(
						items.map(async (item: Article) => {
							await parser.parse(item, this);
							await item.parsedContent.resourceManager.deleteAll();
						}),
					);
				}
				await this._fp.delete(ref.path.parentDirectoryPath, true);
			} else await this._fp.delete(ref.path, true);
		}

		await this._onItemChanged({ item, status: FileStatus.delete });
	}

	private _update(catalog: Catalog) {
		this._name = catalog._name;
		this._props = catalog.props;
		this._errors = catalog._errors;
		this._rootPath = catalog._rootPath;
		this._basePath = catalog._basePath;
		this._rootCategory = catalog._rootCategory;
		this._repo = catalog._repo;
	}

	private async _onItemChanged(update: ItemStatus | ItemStatus[]) {
		const items = Array.isArray(update) ? update : [update];

		await this.events.emit("files-changed", {
			catalog: this,
			items: items.map((i) => ({ ref: i.item.ref, status: i.status })),
		});
	}

	private async _onFileChanged(update: ItemRefStatus | ItemRefStatus[]) {
		await this.events.emit("files-changed", { catalog: this, items: Array.isArray(update) ? update : [update] });
	}

	private _getItems(category: Category, filters?: ItemFilter[]): Item[] {
		const items: Item[] = [];
		const filter = (i: Item) => filters && filters.every((f) => f(i, this));
		category.items.forEach((i) => {
			if (filter(i)) items.push(i);
			if (i.type == ItemType.category) items.push(...this._getItems(i as Category, filters));
		});

		return items;
	}

	private async _moveRootCategoryIfNeed(rootRelative: Path, makeResourceUpdater: MakeResourceUpdater) {
		if (this.getRelativeRootCategoryPath().compare(rootRelative)) return;

		const root = this.getRootCategory();
		const ref = root.ref;
		const to = ref.path.rootDirectory.join(rootRelative).join(new Path(ref.path.nameWithExtension));
		if (!to.rootDirectory.compare(ref.path.rootDirectory)) throw new Error(`Invalid path: ${rootRelative.value}`);
		const rootPath = new Path(`${this._name}/${ref.path.nameWithExtension}`);

		if (!ref.path.compare(rootPath)) {
			await this._fp.move(ref.path, rootPath);
			await this.update();
		}

		for (const item of root.items || []) {
			const path = to.parentDirectoryPath.join(root.ref.path.parentDirectoryPath.subDirectory(item.ref.path));
			const ref = this._fp.getItemRef(path);
			await this.moveItem(item.ref, ref, makeResourceUpdater, [], true);
		}

		await this._fp.move(rootPath, to);
		await this.update();
	}

	private _findItem(
		category: Category,
		parentFilters: ArticleFilter[] = [],
		itemFilters: ArticleFilter[] = [],
	): Item {
		if (this._testArticle(category, [...parentFilters, ...itemFilters])) return category;
		for (const item of category.items) {
			if (item.type != ItemType.category) {
				if (this._testArticle(item as Article, [...parentFilters, ...itemFilters])) return item;
			} else {
				if (this._testArticle(item as Category, parentFilters)) {
					const article = this._findItem(item as Category, parentFilters, itemFilters) as Article;
					if (article) return article;
				}
			}
		}
		return null;
	}

	private _getExistRefs(category: Category, logicPath: string) {
		const startsRefLink = category.logicPath + "/ref:";
		if (logicPath.startsWith(startsRefLink)) {
			const newLinkthis = category.props.refs?.[logicPath.slice(startsRefLink.length)];
			if (newLinkthis) return Path.join(category.logicPath, newLinkthis);
		}
	}

	private _findItemByLogicPath(category: Category, logicPath: string, filters: ArticleFilter[]): Item {
		const existRef = this._getExistRefs(category, logicPath);
		if (existRef) logicPath = existRef;

		if (!this._testArticle(category, filters)) {
			const categories = this._findSimilarArticles(category);
			if (categories.length) {
				if (logicPath === categories[0].logicPath || logicPath.startsWith(categories[0].logicPath)) {
					return this._findErrorArticle(categories[0], filters);
				}
			}
			if (logicPath === category.logicPath || logicPath.startsWith(category.logicPath)) {
				return this._findErrorArticle(category, filters);
			}
			return null;
		}

		if (logicPath === category.logicPath) {
			return category;
		}

		for (const item of category.items) {
			if (item.type == ItemType.category) {
				const article = this._findItemByLogicPath(item as Category, logicPath, filters) as Article;
				if (article) return article;
			} else {
				if (this._testArticle(item as Article, filters) && logicPath === item.logicPath) return item;
				if (logicPath === item.logicPath) {
					return this._findErrorArticle(item as Article, filters);
				}
			}
		}
		return null;
	}

	private _findSimilarArticles(article: Article): Article[] {
		if (!article || !article?.parent) return [];
		return [
			...(article?.parent.items.filter(
				(i) => i.logicPath === article.logicPath && !i.ref.path.compare(article.ref.path),
			) as Article[]),
		];
	}

	private _findErrorArticle(article: Article, filters: ArticleFilter[]) {
		const filter = filters.find((f) => !f(article, this) && (f as any).getErrorArticle);
		if (filter) return (filter as any).getErrorArticle(article.logicPath) as Article;
	}

	private _testArticle(article: Article, filters: ArticleFilter[]) {
		return !filters || filters.every((f) => f(article, this));
	}
}
