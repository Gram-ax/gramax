import type Context from "@core/Context/Context";
import { createEventEmitter, Event } from "@core/Event/EventEmitter";
import type Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type ArticleParser from "@core/FileStructue/Article/ArticleParser";
import { Catalog, type ArticleFilter } from "@core/FileStructue/Catalog/Catalog";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type { Category } from "@core/FileStructue/Category/Category";
import type { Item, UpdateItemProps } from "@core/FileStructue/Item/Item";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import type PathnameData from "@core/RouterPath/model/PathnameData";
import type CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import type IPermission from "@ext/security/logic/Permission/IPermission";

export type ContextualCatalogEvents<P extends CatalogProps = CatalogProps> = Event<
	"props-resolve",
	{ mutableProps: { props: P } }
>;

export default class ContextualCatalog<P extends CatalogProps = CatalogProps> implements ReadonlyCatalog<P> {
	private _events = createEventEmitter<ContextualCatalogEvents>();

	constructor(private readonly _catalog: WeakRef<Catalog<P>>, private readonly _ctx: Context) {}

	get events() {
		return this._events;
	}

	get ctx() {
		return this._ctx;
	}

	get deref() {
		return this._catalog.deref();
	}

	get name() {
		return this.deref.name;
	}

	get perms() {
		return this.deref.perms;
	}

	get basePath() {
		return this.deref.basePath;
	}

	get errors() {
		return this.deref.errors;
	}

	get props() {
		const mutableProps = { props: this.deref.props };
		this._events.emitSync("props-resolve", { mutableProps });
		return mutableProps.props;
	}

	get snippetProvider() {
		return this.deref.snippetProvider;
	}

	get iconProvider() {
		return this.deref.iconProvider;
	}

	get repo() {
		return this.deref.repo;
	}

	getRootCategoryDirectoryPath(): Path {
		return this.deref.getRootCategoryDirectoryPath();
	}

	getRootCategory(): Category<P> {
		return this.deref.getRootCategory();
	}

	getRootCategoryRef(): ItemRef {
		return this.deref.getRootCategoryRef();
	}

	getRootCategoryPath(): Path {
		return this.deref.getRootCategoryPath();
	}

	getRelativeRootCategoryPath(): Path {
		return this.deref.getRelativeRootCategoryPath();
	}

	async getHeadVersion(): Promise<ReadonlyCatalog<P>> {
		return (await this.deref.getHeadVersion()).ctx(this._ctx);
	}

	getRepositoryRelativePath(ref: Path | ItemRef): Path {
		return this.deref.getRepositoryRelativePath(ref);
	}

	getItemRefPath(relativeRepoPath: Path): Path {
		return this.deref.getItemRefPath(relativeRepoPath);
	}

	getItems(): Item[] {
		return this.deref.getItems();
	}

	getContentItems(): Article[] {
		return this.deref.getContentItems();
	}

	getArticles(): Article[] {
		return this.deref.getArticles();
	}

	getCategories(): Category[] {
		return this.deref.getCategories();
	}

	findItemByItemPath<T extends Item = Item>(itemPath: Path): T {
		return this.deref.findItemByItemPath<T>(itemPath);
	}

	findItemByItemRef<T extends Item = Item>(itemRef: ItemRef): T {
		return this.deref.findItemByItemRef<T>(itemRef);
	}

	findArticleByItemRef(itemRef: ItemRef): Article {
		return this.deref.findArticleByItemRef(itemRef);
	}

	findCategoryByItemRef(itemRef: ItemRef): Category {
		return this.deref.findCategoryByItemRef(itemRef);
	}

	findArticle(logicPath: string, filters: ArticleFilter[], root?: Category): Article {
		return this.deref.findArticle(logicPath, filters, root);
	}

	getNeededPermission(): IPermission {
		return this.deref.getNeededPermission();
	}

	getPathname(item: Item): Promise<string> {
		return this.deref.getPathname(item);
	}

	getPathnameData(item: Item): Promise<PathnameData> {
		return this.deref.getPathnameData(item);
	}

	async updateNeededPermission(permissions: IPermission) {
		await this.deref.updateNeededPermission(permissions);
	}

	async updateItemProps(props: UpdateItemProps, rc: ResourceUpdaterFactory): Promise<Item> {
		return await this.deref.updateItemProps(props, rc.withContext(this._ctx));
	}

	async updateProps(props: CatalogEditProps | CatalogProps, rc: ResourceUpdaterFactory): Promise<ReadonlyCatalog<P>> {
		await this.deref.updateProps(props, rc.withContext(this._ctx));
		return this;
	}

	async createArticle(
		rc: ResourceUpdaterFactory,
		markdown: string,
		parentRef?: ItemRef,
		silent?: boolean,
	): Promise<Article> {
		return await this.deref.createArticle(rc.withContext(this._ctx), markdown, parentRef, silent);
	}

	async createCategory(name: string, parentRef?: ItemRef): Promise<Category> {
		return await this.deref.createCategory(name, parentRef);
	}

	async createCategoryByArticle(rc: ResourceUpdaterFactory, article: Article): Promise<Category> {
		return await this.deref.createCategoryByArticle(rc.withContext(this._ctx), article);
	}

	async deleteItem(ref: ItemRef, parser?: ArticleParser, silent?: boolean) {
		await this.deref.deleteItem(ref, parser, silent);
	}
}
