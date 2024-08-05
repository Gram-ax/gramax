import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import FileStructure from "@core/FileStructue/FileStructure";
import { ItemStatus } from "@ext/Watchers/model/ItemStatus";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import Repository from "@ext/git/core/Repository/Repository";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { CatalogErrors } from "@ext/healthcheck/logic/Healthcheck";
import type { FSLocalizationProps } from "@ext/localization/core/rules/FSLocalizationRules";
import IconProvider from "@ext/markdown/elements/icon/logic/IconProvider";
import SnippetProvider from "@ext/markdown/elements/snippet/logic/SnippetProvider";
import TabsTags from "@ext/markdown/elements/tabs/model/TabsTags";
import type { TitledLink } from "@ext/navigation/NavigationLinks";
import { FileStatus } from "../../../extensions/Watchers/model/FileStatus";
import Language, { defaultLanguage } from "../../../extensions/localization/core/model/Language";
import IPermission from "../../../extensions/security/logic/Permission/IPermission";
import Path from "../../FileProvider/Path/Path";
import FileProvider from "../../FileProvider/model/FileProvider";
import ResourceUpdater from "../../Resource/ResourceUpdater";
import itemRefUtils from "../../utils/itemRefUtils";
import { Article } from "../Article/Article";
import { Category } from "../Category/Category";
import { Item } from "../Item/Item";
import { ItemRef } from "../Item/ItemRef";
import { ItemType } from "../Item/ItemType";

export type CatalogInitProps = {
	name: string;
	props: CatalogProps;
	root: Category;
	basePath: Path;
	rootPath: Path;
	errors: CatalogErrors;
	isServerApp: boolean;

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

	relatedLinks?: TitledLink[];
	private?: string[];
	hidden?: boolean;
	refs?: string[];

	sharePointDirectory?: string;
};

export const EXCLUDED_PROPS = ["url", "docroot"];

export class Catalog extends CatalogEntry {
	private _rootCategory: Category;
	private _rootPath: Path;
	private _fp: FileProvider;
	private _fs: FileStructure;

	private _watcherFuncs: WatcherFunc[] = [];
	private _onUpdateNameFuncs: ((oldName: string, catalog: Catalog) => Promise<void>)[] = [];
	private _snippetProvider: SnippetProvider;
	private _iconProvider: IconProvider;
	protected declare _repo: Repository;

	constructor(init: CatalogInitProps) {
		super({
			name: init.name,
			rootCaterogyRef: init.root.ref,
			basePath: init.basePath,
			props: init.props,
			errors: init.errors,
			load: null,
			isServerApp: init.isServerApp,
		});

		this._props = init.props;
		this._rootCategory = init.root;
		this._basePath = init.basePath;
		this._errors = init.errors;
		this._rootPath = init.rootPath;
		this._name = init.name;
		this._fp = init.fp;
		this._fs = init.fs;

		const items = this._getItems(this._rootCategory);
		items.forEach((i) => i.watch(this._onChange.bind(this)));

		this._snippetProvider = new SnippetProvider(this._fp, this._fs, this);

		this._iconProvider = new IconProvider(this._fp, this._fs, this);
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
		this._repo.gvc.watch(async (items) => {
			await this.update(rp);
			await this._onChange(items);
		});
	}

	getRelativeRepPath(itemRef: Path | ItemRef): Path {
		if (itemRef instanceof Path) {
			return this._basePath.subDirectory(itemRef)?.removeExtraSymbols; // TODO: remove `?`
		}
		return this._basePath.subDirectory(itemRef.path)?.removeExtraSymbols; // TODO: remove `?`
	}

	getItemRefPath(relativeRepPath: Path): Path {
		return this._basePath.join(relativeRepPath);
	}

	getBasePath(): Path {
		return this._basePath;
	}

	async deleteItem(itemRef: ItemRef, articleParser?: ArticleParser) {
		const item = this.findItemByItemRef<Article>(itemRef);
		const index = item.parent.items.findIndex((i) => i.ref.path.compare(item?.ref?.path));
		if (index == -1) return;
		item.parent.items.splice(index, 1);

		if (await this._fp.exists(item.ref.path)) {
			if (item.content && articleParser) {
				await articleParser.parse(item, this);
				await item.parsedContent.resourceManager.deleteAll();
			}

			if (item.type == ItemType.category) {
				const items = this._getItems(item as Category);
				if (articleParser) {
					await Promise.all(
						items.map(async (item: Article) => {
							await articleParser.parse(item, this);
							await item.parsedContent.resourceManager.deleteAll();
						}),
					);
				}
				await this._fp.delete(itemRef.path.parentDirectoryPath);
			} else await this._fp.delete(itemRef.path);
		}

		void this._onChange([{ itemRef, type: FileStatus.delete }]);
	}

	hasItems() {
		return this._rootCategory.items?.length > 0;
	}

	async createArticle(
		resourceUpdater: ResourceUpdater,
		markdown: string,
		lang: Language,
		parentRef?: ItemRef,
	): Promise<Article> {
		const parentItem = parentRef
			? this.findItemByItemRef<Category>(parentRef) ?? this._rootCategory
			: this._rootCategory;

		if (parentItem.type == ItemType.article)
			return await this.createCategoryByArticle(resourceUpdater, lang, markdown, parentItem as Article);

		const itemRef: ItemRef = itemRefUtils.create(
			parentItem.ref,
			parentItem.items.map((i) => i.ref),
		);
		const path = new Path(lang == defaultLanguage ? itemRef.path.value : itemRef.path.value + "_" + lang);
		await this._fp.write(path, markdown);
		const article = await this._fs.createArticle(path, parentItem, this._props, this._errors);
		await article.setLastPosition();
		parentItem.items.push(article);
		article.watch(this._onChange.bind(this));
		void this._onChange([{ itemRef: article.ref, type: FileStatus.new }]);
		return article;
	}

	async createCategoryByArticle(
		resourceUpdater: ResourceUpdater,
		lang: Language,
		markdown: string,
		parentArticle: Article,
	) {
		const dir = parentArticle.ref.path.parentDirectoryPath.join(new Path(parentArticle.getFileName()));
		const path = dir.join(new Path(CATEGORY_ROOT_FILENAME));

		const index = parentArticle.parent.items.findIndex((i) => i.ref.path.compare(parentArticle.ref.path));
		await this.deleteItem(parentArticle.ref);
		if (index === -1) return parentArticle;

		const newCategory = await this._fs.createCategory(
			path,
			parentArticle.parent,
			parentArticle,
			this._props,
			this._errors,
		);
		await resourceUpdater.update(parentArticle, newCategory);
		newCategory.watch(this._onChange.bind(this));
		void this._onChange([{ itemRef: newCategory.ref, type: FileStatus.new }]);

		parentArticle.parent.items.splice(index, 0, newCategory);
		return this.createArticle(resourceUpdater, markdown, lang, newCategory.ref);
	}

	async moveItem(oldItemRef: ItemRef, newItemRef: ItemRef, resourceUpdater: ResourceUpdater, rp: RepositoryProvider) {
		const item = this.findItemByItemRef<Article>(oldItemRef);
		if (!item) return;

		if (item.type == ItemType.category) {
			for (const i of (item as Category).items) {
				const childNewBasePath = newItemRef.path.parentDirectoryPath.join(
					item.ref.path.parentDirectoryPath.subDirectory(i.ref.path),
				);
				const childNewItemRef = { path: childNewBasePath, storageId: i.ref.storageId };
				await this.moveItem(i.ref, childNewItemRef, resourceUpdater, rp);
			}
		}

		await this._fp.move(item.ref.path, newItemRef.path);

		await this.update(rp);
		const newItem = this.findItemByItemRef<Article>(newItemRef);
		await resourceUpdater.update(item, newItem);
	}

	async update(rp: RepositoryProvider) {
		const catalog = await this._fs.getCatalogByPath(this._basePath);
		this._name = catalog._name;
		this._props = catalog._props;
		this._errors = catalog._errors;
		this._rootPath = catalog._rootPath;
		this._basePath = catalog._basePath;
		this._rootCategory = catalog._rootCategory;
		await rp.updateRepository(this._repo, this._fp, this._basePath);
		this.setRepo(this._repo, rp);
		this._repo?.storage?.setSyncSearchInPath(this._props.docroot ?? "");
	}

	getNeededPermission(): IPermission {
		return this._rootCategory.neededPermission;
	}

	async updateNeededPermission(permission: IPermission) {
		await this._rootCategory.setNeededPermission(permission);
		this._props.private = this._rootCategory.neededPermission.getValues();
		await this._fs.saveCatalog(this);
	}

	async updateProps(ru: ResourceUpdater, rp: RepositoryProvider, props: CatalogEditProps) {
		Object.keys(props)
			.filter((k) => !EXCLUDED_PROPS.includes(k))
			.forEach((k) => (this._props[k] = props[k]));
		await this._fs.saveCatalog(this);
		await this._moveRootCategoryIfNeed(new Path(props.docroot), ru, rp);
		await this.update(rp);
		if (props.url !== this._name) return this.updateName(props.url, rp);
		return this;
	}

	onUpdateName(onUpdateName: (oldName: string, catalog: Catalog) => Promise<void>) {
		this._onUpdateNameFuncs.push(onUpdateName);
	}

	async updateName(newName: string, rp: RepositoryProvider) {
		const newBasePath = this._basePath.getNewName(newName);
		const oldName = this._name;
		await this._fp.move(this._basePath, newBasePath);
		this._basePath = newBasePath;
		await this.update(rp);
		await Promise.all(this._onUpdateNameFuncs.map((f) => f(oldName, this)));
		return this;
	}

	async getTransformedItems<T>(transformer: (item: Item) => Promise<T> | T): Promise<T[]> {
		const transformedItems: T[] = [];
		for (const item of this._rootCategory.items) {
			transformedItems.push(await transformer(item));
		}
		const items = transformedItems.filter((l) => l);
		return items;
	}

	findItemByItemPath<T extends Item = Item>(itemPath: Path): T {
		return this._findItem(this._rootCategory, [], [(a) => a.ref.path.compare(itemPath)]) as T;
	}

	findItemByItemRef<T extends Item = Item>(itemRef: ItemRef): T {
		return this._findItem(this._rootCategory, [], [(a) => a.ref.path.compare(itemRef.path)]) as T;
	}

	findArticleByItemRef(itemRef: ItemRef): Article {
		return this._findItem(
			this._rootCategory,
			[],
			[(a) => a.ref.path.compare(itemRef.path) && a.type === ItemType.article],
		) as Article;
	}

	findCategoryByItemRef(itemRef: ItemRef): Category {
		return this._findItem(
			this._rootCategory,
			[],
			[(a) => a.ref.path.compare(itemRef.path) && a.type === ItemType.category],
		) as Category;
	}

	findArticle(logicPath: string, filters: ArticleFilter[]): Article {
		const item = this._findItemByLogicPath(this._rootCategory, logicPath, filters);
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

	getItems(filters: ArticleFilter[] = []): Item[] {
		return this._getItems(this._rootCategory, filters);
	}

	getArticles(filters?: ArticleFilter[]): Article[] {
		if (!filters) filters = [];
		filters.push((item: Item) => item.type == ItemType.article);
		return this._getItems(this._rootCategory, filters) as Article[];
	}

	getCategories(filters?: CategoryFilter[]): Category[] {
		if (!filters) filters = [];
		filters.push((item: Item) => item.type == ItemType.category);
		return [this._rootCategory, ...(this._getItems(this._rootCategory, filters) as Category[])];
	}

	getContentItems(filters?: ArticleFilter[]): Article[] {
		if (!filters) filters = [];
		filters.push((article: Article) => !!article.content);
		return this._getItems(this._rootCategory, filters) as Article[];
	}

	watch(w: WatcherFunc): void {
		this._watcherFuncs.push(w);
	}

	private async _onChange(changeItem: ItemStatus[]): Promise<void> {
		const changeCatalog = this._convertToChangeCatalog(changeItem);
		for (const f of this._watcherFuncs) await f(changeCatalog);
	}

	private _getItems(category: Category, filters?: ItemFilter[]): Item[] {
		let items: Item[] = [];
		category.items.forEach((i) => {
			if (i.type == ItemType.category) items.push(i, ...this._getItems(i as Category, filters));
			else items.push(i);
		});
		if (filters) items = items.filter((i) => filters.every((f) => f(i, this)));

		return items;
	}

	private async _moveRootCategoryIfNeed(rootRelative: Path, ru: ResourceUpdater, rp: RepositoryProvider) {
		if (this.getRelativeRootCategoryPath().compare(rootRelative)) return;

		const root = this.getRootCategory();
		const ref = root.ref;
		const to = ref.path.rootDirectory.join(rootRelative).join(new Path(ref.path.nameWithExtension));
		if (!to.rootDirectory.compare(ref.path.rootDirectory)) throw new Error(`Invalid path: ${rootRelative.value}`);
		const rootPath = new Path(`${this._name}/${ref.path.nameWithExtension}`);

		if (!ref.path.compare(rootPath)) {
			await this._fp.move(ref.path, rootPath);
			await this.update(rp);
		}

		await Promise.all(
			root.items?.map((item) => {
				const path = to.parentDirectoryPath.join(root.ref.path.parentDirectoryPath.subDirectory(item.ref.path));
				const ref = this._fp.getItemRef(path);
				return this.moveItem(item.ref, ref, ru, rp);
			}),
		);

		await this._fp.move(rootPath, to);
		await this.update(rp);
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
		const filter = filters.find((f) => !f(article, this) && (f as any).errorArticle);
		if (filter) return (filter as any).errorArticle as Article;
	}

	private _testArticle(article: Article, filters: ArticleFilter[]) {
		return !filters || filters.every((f) => f(article, this));
	}

	private _convertToChangeCatalog(items: ItemStatus[]): ChangeCatalog[] {
		return items.map((item) => ({
			catalog: this,
			type: item.type,
			itemRef: item.itemRef,
		}));
	}
}

export type ItemFilter = (item: Item, catalog: Catalog) => boolean;
export type ArticleFilter = (article: Article, catalog: Catalog) => boolean;
export type CategoryFilter = (category: Category, catalog: Catalog) => boolean;

export interface ChangeCatalog {
	catalog: Catalog;
	itemRef: ItemRef;
	type: FileStatus;
}

type WatcherFunc = (changes: ChangeCatalog[]) => Promise<void>;
