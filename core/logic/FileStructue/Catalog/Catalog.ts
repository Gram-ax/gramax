import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import type Context from "@core/Context/Context";
import { createEventEmitter, type HasEvents } from "@core/Event/EventEmitter";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import parseContent from "@core/FileStructue/Article/parseContent";
import BaseCatalog, { type BaseCatalogInitProps } from "@core/FileStructue/Catalog/BaseCatalog";
import type CatalogEvents from "@core/FileStructue/Catalog/CatalogEvents";
import { CatalogItemSearcher } from "@core/FileStructue/Catalog/CatalogItemSearcher";
import { ExcludedProps, type CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import ContextualCatalogEventHandlers from "@core/FileStructue/Catalog/ContextualCatalogEvents";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import FileStructure from "@core/FileStructue/FileStructure";
import type { MakeResourceUpdater } from "@core/Resource/ResourceUpdaterFactory";
import itemRefUtils from "@core/utils/itemRefUtils";
import { ItemStatus, type ItemRefStatus } from "@ext/Watchers/model/ItemStatus";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import type Repository from "@ext/git/core/Repository/Repository";
import { CatalogErrors } from "@ext/healthcheck/logic/Healthcheck";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import IconProvider from "@ext/markdown/elements/icon/logic/IconProvider";
import SnippetProvider from "@ext/markdown/elements/snippet/logic/SnippetProvider";
import { SystemProperties } from "@ext/properties/models";
import Permission from "@ext/security/logic/Permission/Permission";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import assert from "assert";
import { FileStatus } from "../../../extensions/Watchers/model/FileStatus";
import IPermission from "../../../extensions/security/logic/Permission/IPermission";
import Path from "../../FileProvider/Path/Path";
import FileProvider from "../../FileProvider/model/FileProvider";
import { Article } from "../Article/Article";
import { Category } from "../Category/Category";
import { Item, UpdateItemProps } from "../Item/Item";
import { ItemRef } from "../Item/ItemRef";
import { ItemType } from "../Item/ItemType";

export type ItemFilter = ((item: Item, catalog: ReadonlyCatalog) => boolean) & {
	getErrorArticle?: (pathname: string) => Article;
};
export type ArticleFilter = (article: Article, catalog: ReadonlyCatalog) => boolean;
export type CategoryFilter = (category: Category, catalog: ReadonlyCatalog) => boolean;

export type CatalogInitProps<P extends CatalogProps = CatalogProps> = BaseCatalogInitProps & {
	name: string;
	root: Category<P>;
	errors: CatalogErrors;

	fp: FileProvider;
	fs: FileStructure;
};

export class Catalog<P extends CatalogProps = CatalogProps>
	extends BaseCatalog<P>
	implements ReadonlyCatalog<P>, HasEvents<CatalogEvents>
{
	protected readonly _type = "catalog";

	private _rootCategory: Category<P>;
	private _perms: Permission;

	private _snippetProvider: SnippetProvider;
	private _iconProvider: IconProvider;
	private _errors: CatalogErrors;

	private _fp: FileProvider;
	private _fs: FileStructure;
	private _events = createEventEmitter<CatalogEvents>();
	private _searcher: CatalogItemSearcher;

	private _headVersion: Catalog<P>;
	private _parsedOnce = false;

	constructor(init: CatalogInitProps<P>) {
		super(init);
		this._rootCategory = init.root;
		this._errors = init.errors;
		this._fp = init.fp;
		this._fs = init.fs;
		this._perms = new Permission(init.root.props.private);
		this._searcher = new CatalogItemSearcher(this);

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

	get findArticleCacheHit() {
		return this._searcher.cacheHit;
	}

	setLoadCallback(): void {
		throw new Error("Cannot set load callback for Catalog; Catalog is already loaded.");
	}

	load() {
		return Promise.resolve(this);
	}

	get events() {
		return this._events;
	}

	get perms() {
		return this._perms;
	}

	get props() {
		return this._rootCategory.props;
	}

	get snippetProvider() {
		return this._snippetProvider;
	}

	get iconProvider() {
		return this._iconProvider;
	}

	get errors() {
		return this._errors;
	}

	get deref() {
		return this;
	}

	ctx(ctx: Context) {
		if (!ctx) throw new Error("Provided invalid null context");
		const catalog = new ContextualCatalog(new WeakRef(this), ctx);
		new ContextualCatalogEventHandlers(catalog).mount();
		return catalog;
	}

	getRootCategoryDirectoryPath(): Path {
		return this._rootCategory.folderPath;
	}

	setRepository(repo: Repository) {
		this.repo = repo;
		if (!this.repo.gvc) return;
		this.repo.gvc.events.on("files-changed", async ({ items }) => {
			await this.update();

			await this._onFileChanged(
				items.map((item) => ({
					ref: this._fp.getItemRef(item.path),
					status: item.status,
				})),
			);
		});
		this.repo.events.on("publish", () => {
			this._headVersion = null;
			this.repo?.resetCachedStatus();
			this._searcher.resetCache();
		});
		this.repo.events.on("checkout", () => {
			this._headVersion = null;
		});
		this.repo.events.on("sync", ({ isVersionChanged }) => {
			if (isVersionChanged) this._headVersion = null;
		});
	}

	async getHeadVersion(): Promise<Catalog<P>> {
		if (!this._headVersion) {
			if (!this.repo.gvc) return null;
			const headPath = GitTreeFileProvider.scoped(this.basePath, null);
			this._headVersion = (await this._fs.getCatalogByPath(headPath, false)) as Catalog<P>;
		}
		return this._headVersion;
	}

	getRepositoryRelativePath(ref: Path | ItemRef): Path {
		const path =
			ref instanceof Path
				? this.basePath.subDirectory(ref)?.removeExtraSymbols
				: this.basePath.subDirectory(ref.path)?.removeExtraSymbols;

		assert(path, `cannot get repository path; invalid ref`);
		return path;
	}

	getItemRefPath(relativeRepoPath: Path): Path {
		return this.basePath.join(relativeRepoPath);
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
		const article = await this._fs.createArticle(ref.path, parentItem, this.props, this._errors);
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
			this.props,
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
		this._searcher.resetCache();
		this.repo?.resetCachedStatus();
		return item;
	}

	getNeededPermission(): IPermission {
		return this._rootCategory.neededPermission;
	}

	async updateNeededPermission(permission: IPermission) {
		await this._rootCategory.setNeededPermission(permission);
		this.props.private = this._rootCategory.neededPermission.getValues();
		await this._fs.saveCatalog(this);
	}

	async updateProps(props: CatalogEditProps | CatalogProps, makeResourceUpdater: MakeResourceUpdater) {
		const newProps = {
			...props,
			properties: props?.properties?.filter((property) => !SystemProperties[property.name.toLowerCase()]),
		};
		Object.keys(newProps)
			.filter((k: keyof typeof newProps) => !ExcludedProps.includes(k))
			.forEach((k) => (this.props[k] = newProps[k]));
		await this._fs.saveCatalog(this);
		if (props.docroot) await this._moveRootCategoryIfNeed(new Path(props.docroot), makeResourceUpdater);
		await this.update();
		if (props.url && props.url !== this.name) return this.updateName(props.url);
		return this;
	}

	async updateName(name: string) {
		const mutableName = { name };
		const prev = this.name;
		await this.events.emit("before-set-name", { catalog: this, mutableName });

		const newBasePath = this.basePath.getNewName(mutableName.name);
		await this._fp.move(this.basePath, newBasePath);
		this.basePath = newBasePath;
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

	getRootCategory(): Category<P> {
		return this._rootCategory;
	}

	getRootCategoryRef(): ItemRef {
		return this._rootCategory.ref;
	}

	getRootCategoryPath(): Path {
		return this._rootCategory.folderPath;
	}

	findItemByItemPath<T extends Item = Item>(itemPath: Path): T {
		return this._searcher.findItemByPath(itemPath) as T;
	}

	findItemByItemRef<T extends Item = Item>(itemRef: ItemRef): T {
		return this._searcher.findItemByPath(itemRef) as T;
	}

	findArticleByItemRef(itemRef: ItemRef): Article {
		return this._searcher.findItemByPath(itemRef, ItemType.article) as Article;
	}

	findCategoryByItemRef(itemRef: ItemRef): Category {
		return this._searcher.findItemByPath(itemRef, ItemType.category) as Category;
	}

	findArticle(logicPath: string, filters: ArticleFilter[], root?: Category): Article {
		return this._searcher.findItemByLogicPath(root ?? this._resolveRootCategory(), logicPath, filters) as Article;
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
		if (!item) throw new Error(`Item '${from.path.value}' wasn't found in catalog ${this.basePath.value}`);

		if (item.type == ItemType.category)
			await this._moveCategoryItems(<Category>item, to, makeResourceUpdater, innerRefs);

		const movedItem = await this._moveArticleItem(item, to);

		const resourceUpdater = makeResourceUpdater(this);
		await resourceUpdater.update(item, movedItem, innerRefs);

		const parentFrom = from.path.parentDirectoryPath;
		const dirs = (await this._fp.exists(parentFrom)) ? await this._fp.readdir(parentFrom) : null;
		if (!dirs?.length) await this._fp.delete(parentFrom, false);

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
			this.props,
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

	async parseEveryArticle(ctx: Context, parser: MarkdownParser, parserContextFactory: ParserContextFactory) {
		if (this._parsedOnce) return;
		this._parsedOnce = true;

		await Promise.all(
			this.getArticles().map(async (article) => {
				try {
					await parseContent(article, this, ctx, parser, parserContextFactory);
				} catch (error) {}
			}),
		);
	}

	protected _setHeadVersion(headVersion: Catalog<P>) {
		this._headVersion = headVersion;
	}

	private _resolveRootCategory() {
		return this._rootCategory;
	}

	private async _moveArticleItem(item: Article, to: ItemRef) {
		if (item.props.shouldBeCreated) {
			await this._fp.write(to.path, "");
		} else {
			await item.save();
			await this._fp.move(item.ref.path, to.path);
		}

		const movedItem =
			item.type == ItemType.category
				? await this._fs.makeCategory(
						to.path.parentDirectoryPath,
						this._rootCategory,
						this.props,
						this._errors,
						to.path,
				  )
				: await this._fs.createArticle(to.path, this._rootCategory, this.props, this._errors);

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

	private _update(catalog: Catalog<P>) {
		catalog._setHeadVersion(this._headVersion);
		this.name = catalog.name;
		this._errors = catalog._errors;
		this.basePath = catalog.basePath;
		this._rootCategory = catalog._rootCategory;
		this.setRepository(catalog.repo);
		this._searcher.resetCache();
	}

	private async _onItemChanged(update: ItemStatus | ItemStatus[]) {
		const items = Array.isArray(update) ? update : [update];
		this.repo?.resetCachedStatus();
		this._searcher.resetCache(items.map((i) => i.item.ref.path.value));

		await this.events.emit("files-changed", {
			catalog: this,
			items: items.map((i) => ({ ref: i.item.ref, status: i.status })),
		});
	}

	private async _onFileChanged(update: ItemRefStatus | ItemRefStatus[]) {
		this.repo?.resetCachedStatus();
		this._searcher.resetCache(
			Array.isArray(update) ? update.map((i) => i.ref.path.value) : [update.ref.path.value],
		);
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
		const rootPath = new Path(`${this.name}/${ref.path.nameWithExtension}`);

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
}
