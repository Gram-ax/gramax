import { CATEGORY_ROOT_FILENAME, NEW_ARTICLE_REGEX } from "@app/config/const";
import type Context from "@core/Context/Context";
import { createEventEmitter, type HasEvents, type UnsubscribeToken } from "@core/Event/EventEmitter";
import type ArticleParser from "@core/FileStructue/Article/ArticleParser";
import parseContent from "@core/FileStructue/Article/parseContent";
import BaseCatalog, { type BaseCatalogInitProps } from "@core/FileStructue/Catalog/BaseCatalog";
import type CatalogEvents from "@core/FileStructue/Catalog/CatalogEvents";
import { CatalogItemSearcher } from "@core/FileStructue/Catalog/CatalogItemSearcher";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import ContextualCatalogEventHandlers from "@core/FileStructue/Catalog/ContextualCatalogEvents";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type FileStructure from "@core/FileStructue/FileStructure";
import type { MakeResourceUpdater } from "@core/Resource/ResourceUpdaterFactory";
import itemRefUtils from "@core/utils/itemRefUtils";
import { uniqueName } from "@core/utils/uniqueName";
import AgentResourcesProvider from "@ext/agent/core/agentResourcesProvider";
import PromptProvider from "@ext/ai/logic/PromptProvider";
import type CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps";
import { CatalogViewProvider } from "@ext/catalog/views/logic/CatalogViewProvider";
import type Repository from "@ext/git/core/Repository/Repository";
import InboxProvider from "@ext/inbox/logic/InboxProvider";
import { addEvent, Level, trace } from "@ext/loggers/opentelemetry";
import ParseError from "@ext/markdown/core/Parser/Error/ParseError";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import CommentProvider from "@ext/markdown/elements/comment/edit/logic/CommentProvider";
import FragmentProvider from "@ext/markdown/elements/fragment/logic/FragmentProvider";
import IconProvider from "@ext/markdown/elements/icon/logic/IconProvider";
import CatalogLinksProvider from "@ext/properties/logic/CatalogLinksProvider";
import Permission from "@ext/security/logic/Permission/Permission";
import TemplateProvider from "@ext/templates/logic/TemplateProvider";
import { hasScopeSeparator } from "@ext/versioning/addScopeToPath";
import type { ItemRefStatus, ItemStatus } from "@ext/Watchers/model/ItemStatus";
import assert from "assert";
import type IPermission from "../../../extensions/security/logic/Permission/IPermission";
import { FileStatus } from "../../../extensions/Watchers/model/FileStatus";
import type FileProvider from "../../FileProvider/model/FileProvider";
import Path from "../../FileProvider/Path/Path";
import { recordMoveAlias } from "../Alias/aliasAutowrite";
import { CatalogAliases } from "../Alias/CatalogAliases";
import type { Article } from "../Article/Article";
import type { Category } from "../Category/Category";
import { type Item, NAV_STRUCTURAL_PROPS, type UpdateItemProps } from "../Item/Item";
import type { ItemRef } from "../Item/ItemRef";
import { ItemType } from "../Item/ItemType";

export type ItemFilter = ((item: Item, catalog: ReadonlyCatalog) => boolean) & {
	getErrorArticle?: (pathname: string) => Article;
};
export type ArticleFilter = (article: Article, catalog: ReadonlyCatalog) => boolean;
export type CategoryFilter = (category: Category, catalog: ReadonlyCatalog) => boolean;

export type CatalogInitProps<P extends CatalogProps = CatalogProps> = BaseCatalogInitProps & {
	name: string;
	root: Category<P>;

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
	private _unsubscirbeTokens: {
		repo: UnsubscribeToken[];
		gvc: UnsubscribeToken[];
	} = {
		repo: [],
		gvc: [],
	};

	private _fp: FileProvider;
	private _fs: FileStructure;
	private _events = createEventEmitter<CatalogEvents>();
	private _searcher: CatalogItemSearcher;
	private _aliases: CatalogAliases;
	private _customProviders: {
		iconProvider: IconProvider;
		fragmentProvider: FragmentProvider;
		inboxProvider: InboxProvider;
		templateProvider: TemplateProvider;
		promptProvider: PromptProvider;
		agentResourcesProvider: AgentResourcesProvider;
		linksProvider: CatalogLinksProvider;
		commentProvider: CommentProvider;
		viewProvider: CatalogViewProvider;
	};

	private _parsedOnce = false;

	constructor(init: CatalogInitProps<P>) {
		super(init);
		this._rootCategory = init.root;
		this._fp = init.fp;
		this._fs = init.fs;
		this._perms = new Permission(init.root.props.private);
		this._searcher = new CatalogItemSearcher(this);

		// Scoped (revision) catalogs have names like "<repo>:commit-<sha>". The ":" is illegal in Windows filenames
		// and any on-disk cache keyed by name (see Cache.getCacheDirPath) fails make_dir with os error 267.
		const useCache = !this._fp.isReadOnly && !hasScopeSeparator(init.name);

		this._customProviders = {
			iconProvider: new IconProvider(this._fp, this._fs, this),
			fragmentProvider: new FragmentProvider(this._fp, this._fs, this),
			inboxProvider: new InboxProvider(this._fp, this._fs, this),
			templateProvider: new TemplateProvider(this._fp, this._fs, this),
			promptProvider: new PromptProvider(this._fp, this._fs, this),
			agentResourcesProvider: new AgentResourcesProvider(this._fp, this._fs, this),
			linksProvider: new CatalogLinksProvider(this._fs, this),
			commentProvider: new CommentProvider(this._fp, this._fs, this, useCache),
			viewProvider: new CatalogViewProvider(this._fp, this),
		};
	}

	get isFpReadOnly() {
		return this._fs.fp.at(this.basePath).isReadOnly;
	}

	get findArticleCacheHit() {
		return this._searcher.cacheHit;
	}

	resetSearcherCache() {
		this._resetCache();
	}

	get customProviders() {
		return this._customProviders;
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

	setRepository(repo: Repository, subscribeToEvents = true) {
		const prev = this.repo;

		if (prev?.gvc) this._unsubscirbeTokens.gvc.forEach((token) => prev.gvc.events.off(token));
		if (prev) {
			this._unsubscirbeTokens.repo.forEach((token) => prev.events.off(token));
			prev.unsubscribeEvents();
		}
		this._unsubscirbeTokens = { repo: [], gvc: [] };

		this.repo = repo;

		this._events.emitSync("repository-set", { catalog: this });

		if (!this.repo?.gvc || !subscribeToEvents) return;

		this.repo.subscribeFpEvents();

		const fileChangesToken = this.repo.gvc.events.on("files-changed", async ({ items }) => {
			await this.update();

			await this._onFileChanged(
				items.map((item) => ({
					ref: this._fp.getItemRef(item.path),
					status: item.status,
				})),
			);
		});
		this._unsubscirbeTokens.gvc.push(fileChangesToken);

		const publishToken = this.repo.events.on("publish", () => {
			this.repo?.resetCachedStatus();
			this._resetCache();
		});
		this._unsubscirbeTokens.repo.push(publishToken);

		const mergeToken = this.repo.events.on("merge", async (args) => {
			await this._events.emit("merge", { catalog: this, ...args });
		});

		const syncToken = this.repo.events.on("sync", async (args) => {
			await this._events.emit("sync", { catalog: this, ...args });
		});

		const checkoutToken = this.repo.events.on("checkout", async (args) => {
			await this._events.emit("checkout", { catalog: this, ...args });
		});

		const resetToken = this.repo.gvc.events.on("reset", async () => {
			await this._events.emit("reset", { catalog: this });
		});
		this._unsubscirbeTokens.gvc.push(resetToken);

		this._unsubscirbeTokens.repo.push(mergeToken, syncToken, checkoutToken);
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

	toCatalogRelativePath(workspaceRel: Path): Path | null {
		const base = this.basePath.removeExtraSymbols.value;
		const path = workspaceRel.removeExtraSymbols.value;
		if (!base) return new Path(path);
		if (path === base) return Path.empty;
		if (!path.startsWith(`${base}/`)) return null;
		return new Path(path.slice(base.length + 1));
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
		afterRef?: ItemRef,
	): Promise<Article> {
		const parentItem = parentRef
			? (this.findItemByItemRef<Category>(parentRef) ?? this._resolveRootCategory())
			: this._resolveRootCategory();

		if (parentItem.type === ItemType.article) {
			const category = await this.createCategoryByArticle(makeResourceUpdater, parentItem as Article);
			if (!silent)
				await this.events.emit("item-created", {
					catalog: this,
					makeResourceUpdater,
					parentRef,
				});
			return await this.createArticle(makeResourceUpdater, markdown, category.ref, true);
		}

		const ref: ItemRef = itemRefUtils.create(
			parentItem.ref,
			parentItem.items.map((i) => i.ref),
		);

		await this._fp.write(ref.path, markdown);
		const article = await this._fs.createArticle(ref.path, parentItem, null, this);
		const lastItem = parentItem.items[parentItem.items.length - 1];
		const afterItem = afterRef ? (this.findItemByItemRef(afterRef) ?? lastItem) : undefined;
		await article.setOrderAfter(parentItem, afterItem);
		const afterIndex = afterItem ? parentItem.items.indexOf(afterItem) : -1;
		parentItem.items.splice(afterIndex + 1, 0, article);
		article.events.on("item-changed", this._onItemChanged.bind(this));
		article.events.on(
			"item-order-updated",
			async (args) =>
				await this.events.emit("item-order-updated", {
					catalog: this,
					...args,
				}),
		);

		await this._onItemChanged({ item: article, status: FileStatus.new });
		if (!silent)
			await this.events.emit("item-created", {
				catalog: this,
				makeResourceUpdater,
				parentRef,
			});
		return article;
	}

	async createCategory(name: string, parentRef?: ItemRef): Promise<Category> {
		const parentItem = parentRef
			? (this.findItemByItemRef<Category>(parentRef) ?? this._resolveRootCategory())
			: this._resolveRootCategory();

		if (parentItem.type === ItemType.article)
			throw new Error(`Cannot create category: parent item is article; ref: ${parentItem.ref.path.value}`);

		const category = await this._fs.createCategory(
			parentItem.folderPath.join(new Path([name, CATEGORY_ROOT_FILENAME])),
			parentItem,
			null,
			this,
		);

		category.events.on("item-changed", this._onItemChanged.bind(this));
		category.events.on(
			"item-order-updated",
			async (args) =>
				await this.events.emit("item-order-updated", {
					catalog: this,
					...args,
				}),
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
		await item.updateProps(props, makeResourceUpdater(this), this);
		await this.events.emit("item-props-updated", {
			catalog: this,
			ref,
			item,
			props,
			makeResourceUpdater,
		});
		this._resetCache();
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
		await super.updateProps(props, makeResourceUpdater);

		await this._fs.saveCatalog(this);
		if (props.docroot) await this._moveRootCategoryIfNeed(new Path(props.docroot), makeResourceUpdater);
		await this.update();
		if (props.url && props.url !== this.name) await this.updateName(props.url);
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

	getCategoryItems(category: Category): Item[] {
		return category.items;
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

	get aliases(): CatalogAliases {
		this._aliases ??= new CatalogAliases(this, this._searcher);
		return this._aliases;
	}

	getItems(filters: ArticleFilter[] = [], root?: Category): Article[] {
		return this._getItems(root || this._resolveRootCategory(), filters) as Article[];
	}

	getCategories(filters?: CategoryFilter[]): Category[] {
		// biome-ignore lint/style/noParameterAssign: idc
		if (!filters) filters = [];
		filters.push((item: Item) => item.type === ItemType.category);
		const root = this._resolveRootCategory();
		return [root, ...(this._getItems(root, filters) as Category[])];
	}

	getContentItems(filters?: ArticleFilter[]): Article[] {
		// biome-ignore lint/style/noParameterAssign: idc
		if (!filters) filters = [];
		filters.push((article: Article) => article.hasContent());
		return this._getItems(this._resolveRootCategory(), filters) as Article[];
	}

	@trace({ level: Level.Internal })
	async moveItem(
		from: ItemRef,
		to: ItemRef,
		makeResourceUpdater: MakeResourceUpdater,
		innerRefs?: ItemRef[],
		silent?: boolean,
		collectPaths?: { oldPath: Path; newPath: Path }[],
	): Promise<Item> {
		const isRoot = !collectPaths;
		const collect = collectPaths ?? [];

		const item = this.findItemByItemRef<Article>(from);
		assert(item, `Item '${from.path.value}' wasn't found in catalog ${this.basePath.value}`);

		const shouldRecordAlias = isRoot && !silent && !NEW_ARTICLE_REGEX.test(item.getFileName());
		const aliasFrom = shouldRecordAlias ? this.relativeLogicPath(item.logicPath) : null;
		if (shouldRecordAlias) this.aliases.assertNotManual(aliasFrom, item);

		if (!item.props.shouldBeCreated) await item.getContent();

		if (item.type === ItemType.category)
			await this._moveCategoryItems(<Category>item, to, makeResourceUpdater, innerRefs, collect);

		const movedItem = await this._moveArticleItem(item, to);
		if (isRoot) await this._replaceItemInTree(item, movedItem);

		const resourceUpdater = makeResourceUpdater(this);
		await resourceUpdater.update(item, movedItem, innerRefs);

		if (!silent)
			await this.events.emit("item-moved", {
				catalog: this,
				from,
				to,
				makeResourceUpdater,
				innerRefs,
			});

		collect.push({ oldPath: from.path, newPath: movedItem.ref.path });

		if (isRoot) {
			await resourceUpdater.updateOtherArticlesBatch(collect, innerRefs);
		}

		if (shouldRecordAlias) {
			const aliasTo = this.relativeLogicPath(movedItem.logicPath);
			if (aliasFrom && aliasFrom !== aliasTo) {
				await this.aliases.stealAuto(aliasFrom, movedItem);
				recordMoveAlias(movedItem.props, aliasFrom, aliasTo);
				await movedItem.save();
			}
		}

		return movedItem;
	}

	relativeLogicPath(logicPath: string): string {
		const root = this.getRootCategory().logicPath;
		return logicPath === root
			? ""
			: logicPath.startsWith(`${root}/`)
				? logicPath.slice(root.length + 1)
				: logicPath;
	}

	private async _replaceItemInTree(oldItem: Item, newItem: Item): Promise<void> {
		const oldParent = oldItem.parent;
		const newParent = newItem.parent ?? this._rootCategory;

		if (oldParent && newParent) {
			if (oldParent !== newParent) {
				const oldIdx = oldParent.items.indexOf(oldItem);
				if (oldIdx !== -1) oldParent.items.splice(oldIdx, 1);
				newParent.items.push(newItem);
				await newParent.sortItems("no-sort");
			} else {
				const oldIdx = oldParent.items.indexOf(oldItem);
				if (oldIdx !== -1) oldParent.items.splice(oldIdx, 1, newItem);
			}
		}

		this._resetCache([oldItem.ref.path.value, newItem.ref.path.value]);
	}

	async categoryPathByArticle(article: Article) {
		const parentPath = article.ref.path.parentDirectoryPath;
		const readdir = await this._fp.readdir(parentPath);
		const name = uniqueName(article.getFileName(), readdir);
		return parentPath.join(new Path(name)).join(new Path(CATEGORY_ROOT_FILENAME));
	}

	@trace({ level: Level.Internal })
	async createCategoryByArticle(
		makeResourceUpdater: MakeResourceUpdater,
		parentArticle: Article,
		forcePath?: Path,
	): Promise<Category> {
		const path = forcePath ?? (await this.categoryPathByArticle(parentArticle));
		const oldArticlePath = parentArticle.ref.path;

		const index = parentArticle.parent.items.findIndex((i) => i.ref.path.compare(parentArticle.ref.path));
		const cachedContent = await parentArticle.getContent();
		await this._deleteItem(parentArticle.ref);
		if (index === -1 || parentArticle.type === ItemType.category) return parentArticle as Category;

		const articleSnapshot = {
			props: parentArticle.props,
			content: cachedContent,
		};
		const category = await this._fs.createCategory(path, parentArticle.parent, articleSnapshot, this);

		const resourceUpdater = makeResourceUpdater(this);
		await resourceUpdater.update(parentArticle, category);
		category.events.on("item-changed", this._onItemChanged.bind(this));
		category.events.on(
			"item-order-updated",
			async (args) =>
				await this.events.emit("item-order-updated", {
					catalog: this,
					...args,
				}),
		);

		parentArticle.parent.items.splice(index, 0, category);
		await this._onItemChanged({ item: category, status: FileStatus.new });

		await resourceUpdater.updateOtherArticlesBatch([{ oldPath: oldArticlePath, newPath: category.ref.path }]);

		return category;
	}

	@trace({ level: Level.Internal })
	async parseEveryItem(ctx: Context, parser: MarkdownParser, parserContextFactory: ParserContextFactory) {
		if (this._parsedOnce) return;
		this._parsedOnce = true;

		await Promise.all(
			this.getItems().map(async (article) => {
				try {
					await parseContent(article, this, ctx, parser, parserContextFactory);
				} catch {}
			}),
		);
	}

	bindItemEvents() {
		for (const item of this.getItems()) {
			item.events.on("item-changed", this._onItemChanged.bind(this));
			item.events.on(
				"item-order-updated",
				async (args) =>
					await this.events.emit("item-order-updated", {
						catalog: this,
						...args,
					}),
			);
		}
	}

	private _resolveRootCategory() {
		return this._rootCategory;
	}

	private _resetCache(paths?: string[]) {
		this._searcher.resetCache(paths);
		this._aliases?.invalidate();
	}

	private async _moveArticleItem(item: Article, to: ItemRef) {
		if (item.props.shouldBeCreated) {
			await this._fp.write(to.path, "");
		} else {
			await this._fp.move(item.ref.path, to.path);
		}

		const destDir = to.path.parentDirectoryPath;
		const parentDir = item.type === ItemType.category ? destDir.parentDirectoryPath : destDir;
		const destinationParent =
			this.getCategories().find((c) => c.folderPath.compare(parentDir)) ?? this._rootCategory;

		const movedItem =
			item.type === ItemType.category
				? await this._fs.makeCategory(to.path.parentDirectoryPath, destinationParent, this, to.path)
				: await this._fs.createArticle(to.path, destinationParent, null, this);

		return movedItem;
	}

	private async _moveCategoryItems(
		item: Category,
		to: ItemRef,
		makeResourceUpdater: MakeResourceUpdater,
		innerRefs: ItemRef[],
		collect: { oldPath: Path; newPath: Path }[],
	) {
		const dst = await this._getCategoryUniqueName(
			to.path.parentDirectoryPath.name,
			to.path.parentDirectoryPath.parentDirectoryPath,
		);

		to.path = dst.join(new Path(CATEGORY_ROOT_FILENAME));

		for (const i of item.items) {
			const childNewBasePath = to.path.parentDirectoryPath.join(
				item.ref.path.parentDirectoryPath.subDirectory(i.ref.path),
			);
			const childNewItemRef = {
				path: childNewBasePath,
				storageId: i.ref.storageId,
			};
			await this.moveItem(i.ref, childNewItemRef, makeResourceUpdater, innerRefs, true, collect);
		}
	}

	protected async _deleteItem(ref: ItemRef, parser?: ArticleParser) {
		const item = this.findItemByItemRef<Article>(ref);
		if (!item) return;

		const index = item.parent.items.findIndex((i) => i.ref.path.compare(item?.ref?.path));
		if (index === -1) return;
		item.parent.items.splice(index, 1);

		if (await this._fp.exists(item.ref.path)) {
			if (item.hasContent() && parser) {
				await this._cleanupItemResources(item, parser);
			}

			if (item.type === ItemType.category) {
				const items = this._getItems(item as Category);
				if (parser) {
					await Promise.all(items.map((item: Article) => this._cleanupItemResources(item, parser)));
				}
				await this._fp.delete(ref.path.parentDirectoryPath, true);
			} else await this._fp.delete(ref.path, true);
		}

		await this._onItemChanged({ item, status: FileStatus.delete });
	}

	// Drops the resources referenced by an item before it is removed. A ParseError (broken markup)
	// must not abort the delete — the file still has to leave the disk, otherwise it reappears on the
	// next catalog reload (#581). We only skip the (best-effort) resource cleanup for that item.
	private async _cleanupItemResources(item: Article, parser: ArticleParser) {
		try {
			await parser.parse(item, this);
		} catch (e) {
			if (!(e instanceof ParseError)) throw e;
			addEvent("deleteItem-parseContentFailed", Level.Internal, {
				path: item.ref.path.value,
			});
			return;
		}

		await item.parsedContent.write(async (p) => {
			if (!p) return p;
			await p.parsedContext.getResourceManager().deleteAll();
			return p;
		});
	}

	async patchModified(rel: Path): Promise<{ navPropsChanged: boolean }> {
		const itemPath = this.basePath.join(rel);
		const item = this.findItemByItemPath<Article>(itemPath);
		if (!item || (item.type !== ItemType.article && item.type !== ItemType.category))
			return { navPropsChanged: false };

		const prev = NAV_STRUCTURAL_PROPS.map((prop) => item.props[prop]);
		await item.reloadFromDisk(this);
		await this._onItemChanged({ item, status: FileStatus.modified });
		return {
			navPropsChanged: NAV_STRUCTURAL_PROPS.some((prop, i) => item.props[prop] !== prev[i]),
		};
	}

	private _update(catalog: Catalog<P>) {
		this.name = catalog.name;
		this.basePath = catalog.basePath;
		this._rootCategory = catalog._rootCategory;
		this.setRepository(catalog.repo);
		this._resetCache();
	}

	private async _onItemChanged(update: ItemStatus | ItemStatus[]) {
		const items = Array.isArray(update) ? update : [update];
		this.repo?.resetCachedStatus();

		const fileStructueChenged = items.some((i) => i.status === FileStatus.delete || i.status === FileStatus.rename);
		this._resetCache(fileStructueChenged ? null : items.map((i) => i.item.ref.path.value));

		await this.events.emit("files-changed", {
			catalog: this,
			items: items.map((i) => ({ ref: i.item.ref, status: i.status })),
		});
	}

	private async _onFileChanged(update: ItemRefStatus | ItemRefStatus[]) {
		this.repo?.resetCachedStatus();
		this._resetCache(Array.isArray(update) ? update.map((i) => i.ref.path.value) : [update.ref.path.value]);
		await this.events.emit("files-changed", {
			catalog: this,
			items: Array.isArray(update) ? update : [update],
		});
	}

	private _getItems(category: Category, filters?: ItemFilter[]): Item[] {
		const items: Item[] = [];
		const filter = (i: Item) => filters?.every((f) => f(i, this));
		category.items.forEach((i) => {
			if (filter(i)) items.push(i);
			if (i.type === ItemType.category) items.push(...this._getItems(i as Category, filters));
		});

		return items;
	}

	private async _getCategoryUniqueName(name: string, dir: Path) {
		const exist = await this._fp.exists(dir);
		const readdir = exist ? await this._fp.readdir(dir) : [];
		const paths = readdir.map((r) => new Path(r).name);
		return dir.join(new Path(uniqueName(name, paths)));
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

		const collect: { oldPath: Path; newPath: Path }[] = [];
		for (const item of root.items || []) {
			const path = to.parentDirectoryPath.join(root.ref.path.parentDirectoryPath.subDirectory(item.ref.path));
			const ref = this._fp.getItemRef(path);
			await this.moveItem(item.ref, ref, makeResourceUpdater, [], true, collect);
		}

		await this._fp.move(rootPath, to);
		await this.update();

		const resourceUpdater = makeResourceUpdater(this);
		await resourceUpdater.updateOtherArticlesBatch(collect);
	}
}
