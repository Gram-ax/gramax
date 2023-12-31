import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import CatalogFileStructure from "@core/FileStructue/Catalog/CatalogFileStructure";
import { CATEGORY_ROOT_FILENAME, FSProps } from "@core/FileStructue/FileStructure";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import { ItemStatus } from "@ext/Watchers/model/ItemStatus";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import VersionControl from "../../../extensions/VersionControl/VersionControl";
import VersionControlProvider from "../../../extensions/VersionControl/model/VersionControlProvider";
import { FileStatus } from "../../../extensions/Watchers/model/FileStatus";
import Language, { defaultLanguage } from "../../../extensions/localization/core/model/Language";
import IPermission from "../../../extensions/security/logic/Permission/IPermission";
import Storage from "../../../extensions/storage/logic/Storage";
import StorageProvider from "../../../extensions/storage/logic/StorageProvider";
import Path from "../../FileProvider/Path/Path";
import FileProvider from "../../FileProvider/model/FileProvider";
import ResourceUpdater from "../../Resource/ResourceUpdater";
import itemRefUtils from "../../utils/itemRefUtils";
import { Article } from "../Article/Article";
import { Category } from "../Category/Category";
import { Item, ItemRef, ItemType } from "../Item/Item";
import { CatalogErrorGroups } from "./CatalogErrorGroups";

export type CatalogInitProps = {
	name: string;
	props: FSProps;
	root: Category;
	basePath: Path;
	rootPath: Path;
	errors: CatalogErrors;

	fp: FileProvider;
	fs: CatalogFileStructure;

	entry?: CatalogEntry;
};

export class Catalog {
	private _props: FSProps;
	private _rootCategory: Category;
	private _name: string;
	private _basePath: Path;
	private _errors: CatalogErrors;
	private _rootPath: Path;
	private _fp: FileProvider;
	private _fs: CatalogFileStructure;
	private _entry: CatalogEntry;

	private _storage: Storage;
	private _watcherFuncs: WatcherFunc[] = [];
	private _versionControl: VersionControl;
	private _onUpdateNameFuncs: ((oldName: string, catalog: Catalog) => Promise<void>)[] = [];

	constructor(init: CatalogInitProps) {
		this._props = init.props;
		this._rootCategory = init.root;
		this._basePath = init.basePath;
		this._errors = init.errors;
		this._rootPath = init.rootPath;
		this._name = init.name;
		this._fp = init.fp;
		this._fs = init.fs;
		this._entry = init.entry;

		const items = this._getItems(this._rootCategory);
		items.forEach((i) => i.watch(this._onChange.bind(this)));
	}

	getName(): string {
		return this._name;
	}

	setStorage(storage: Storage) {
		this._storage = storage;
	}

	setVersionControl(sp: StorageProvider, vcp: VersionControlProvider, versionControl: VersionControl) {
		this._versionControl = versionControl;
		if (!this._versionControl) return;
		this._versionControl.watch((items) => {
			this._onChange(items);
			void this.update(sp, vcp);
		});
	}

	getVersionControl(): Promise<VersionControl> {
		if (!this._versionControl) return null;
		return Promise.resolve(this._versionControl);
	}

	getStorage(): Storage {
		if (!this._storage) return null;
		return this._storage;
	}

	getRelativeRepPath(itemRef: Path | ItemRef): Path {
		if (itemRef instanceof Path) {
			return this._basePath.subDirectory(itemRef).removeExtraSymbols;
		}
		return this._basePath.subDirectory(itemRef.path).removeExtraSymbols;
	}

	getItemRefPath(relativeRepPath: Path): Path {
		return this._basePath.join(relativeRepPath);
	}

	getBasePath(): Path {
		return this._basePath;
	}

	async deleteItem(itemRef: ItemRef, articleParser?: ArticleParser) {
		const item = this.findItemByItemRef(itemRef);
		const index = item.parent.items.findIndex((i) => i.ref.path.compare(item?.ref?.path));
		if (index == -1) return;
		item.parent.items.splice(index, 1);
		if (item.type == ItemType.category) await this._fp.delete(itemRef.path.parentDirectoryPath);
		else await this._fp.delete(itemRef.path);

		if ((item as Article).content && articleParser) {
			await articleParser.parse(item as Article, this);
			await (item as Article).parsedContent.resourceManager.deleteAll(this._fp);
		}

		if (item.type == ItemType.category) {
			const items = this._getItems(item as Category);
			if (articleParser) {
				await Promise.all(
					items.map(async (item) => {
						await articleParser.parse(item as Article, this);
						await (item as Article).parsedContent.resourceManager.deleteAll(this._fp);
					}),
				);
			}
			await this._fp.delete(itemRef.path.parentDirectoryPath);
		} else await this._fp.delete(itemRef.path);

		this._onChange([{ itemRef, type: FileStatus.delete }]);
	}

	async createArticle(
		resourceUpdater: ResourceUpdater,
		markdown: string,
		lang: Language,
		parentRef?: ItemRef,
	): Promise<Article> {
		const parentItem = parentRef ? (this.findItemByItemRef(parentRef) as Category) : this._rootCategory;
		if (parentItem.type == ItemType.article) {
			return await this.createCategoryByArticle(resourceUpdater, lang, markdown, parentItem as Article);
		}
		const itemRef: ItemRef = itemRefUtils.create(
			parentItem.ref,
			parentItem.items.map((i) => i.ref),
		);
		const path = new Path(lang == defaultLanguage ? itemRef.path.value : itemRef.path.value + "_" + lang);
		await this._fp.write(path, markdown);
		const article = await this._fs.createArticle(path, parentItem, this._props, this._errors);
		await article.setLastPosition();
		parentItem.items.push(article);
		this._onChange([{ itemRef: article.ref, type: FileStatus.new }]);
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
		await resourceUpdater.updateArticle(parentArticle, this, path);

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

		parentArticle.parent.items.splice(index, 0, newCategory);
		return this.createArticle( resourceUpdater, markdown, lang,  newCategory.ref);
	}

	async moveItem(oldItemRef: ItemRef, newItemRef: ItemRef, resourceUpdater: ResourceUpdater) {
		const category = this.findItemByItemRef(oldItemRef);
		if (!category) return;

		await resourceUpdater.updateArticle(category as Article, this, newItemRef.path);
		await this._fp.move(category.ref.path, newItemRef.path);
		if (category.type == ItemType.category) {
			for (const item of (category as Category).items) {
				const childNewBasePath = newItemRef.path.parentDirectoryPath.join(
					category.ref.path.parentDirectoryPath.subDirectory(item.ref.path),
				);
				const childNewItemRef = { path: childNewBasePath, storageId: item.ref.storageId };
				await this.moveItem(item.ref, childNewItemRef, resourceUpdater);
			}
		}
	}

	async update(sp: StorageProvider, vcp: VersionControlProvider) {
		const catalog = await this._fs.getCatalogByPath(this._basePath);
		this._name = catalog._name;
		this._props = catalog._props;
		this._errors = catalog._errors;
		this._rootPath = catalog._rootPath;
		this._basePath = catalog._basePath;
		this._rootCategory = catalog._rootCategory;
		this.setStorage(await sp.getStorageByPath(this._basePath, this._fp));
		this.setVersionControl(sp, vcp, await vcp.getVersionControlByPath(this._basePath, this._fp));
	}

	getNeededPermission(): IPermission {
		return this._rootCategory.neededPermission;
	}

	async updateNeededPermission(permission: IPermission) {
		await this._rootCategory.setNeededPermission(permission);
		this._props["private"] = this._rootCategory.neededPermission.getValues();
		await this._fs.saveCatalog(this);
	}

	asEntry(): CatalogEntry {
		return this._entry;
	}

	getProps(): FSProps {
		return this._props;
	}

	getProp(propName: string): any {
		return this._props[propName];
	}

	async updateProps(sp: StorageProvider, vcp: VersionControlProvider, props: CatalogEditProps) {
		Object.keys(props).forEach((key) => {
			if (key !== "url") this._props[key] = props[key];
		});
		await this._fs.saveCatalog(this);
		await this.update(sp, vcp);
		if (props.url !== this._name) return this.updateName(props.url, sp, vcp);
		return this;
	}

	onUpdateName(onUpdateName: (oldName: string, catalog: Catalog) => Promise<void>) {
		this._onUpdateNameFuncs.push(onUpdateName);
	}

	async updateName(newName: string, sp: StorageProvider, vcp: VersionControlProvider) {
		const newBasePath = this._basePath.getNewName(newName);
		const oldName = this._name;
		await this._fp.move(this._basePath, newBasePath);
		this._basePath = newBasePath;
		await this.update(sp, vcp);
		await Promise.all(this._onUpdateNameFuncs.map((f) => f(oldName, this)));
		return this;
	}

	async getTransformedItems<T>(transformer: (item: Item) => Promise<T> | T): Promise<T[]> {
		const transformedItems: T[] = [];
		for (const item of this._rootCategory.items) {
			transformedItems.push(await transformer(item));
		}
		return transformedItems.filter((l) => l);
	}

	findItemByItemPath(itemPath: Path): Item {
		return this._findItem(this._rootCategory, [], [(a) => a.ref.path.compare(itemPath)]) as Article;
	}

	findItemByItemRef(itemRef: ItemRef): Item {
		return this._findItem(this._rootCategory, [], [(a) => a.ref.path.compare(itemRef.path)]) as Article;
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
		if (item.type === ItemType.category && (item as Category).content) return item as Article;
		if (item.type === ItemType.article) return item as Article;
		return this._findItem(item as Category, filters, [(a) => !!a.content]) as Article;
	}

	findAnyArticle(logicPath: string, filters: ArticleFilter[]): Article {
		let item: Article = null;
		while ((!item || (item.content && item.errorCode)) && logicPath) {
			item = this.findArticle(logicPath, filters);
			logicPath = new Path(logicPath).parentDirectoryPath.value;
		}
		return item;
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

	getErrors(): CatalogErrors {
		return this._errors;
	}

	watch(w: WatcherFunc): void {
		this._watcherFuncs.push(w);
	}

	private _onChange(changeItem: ItemStatus[]): void {
		const changeCatalog = this._convertToChangeCatalog(changeItem);
		this._watcherFuncs.forEach((w) => w(changeCatalog));
	}

	private _getItems(category: Category, filters?: ItemFilter[]): Item[] {
		let items: Item[] = [];
		category.items.forEach((i) => {
			if (i.type == ItemType.category) items.push(...[i, ...this._getItems(i as Category, filters)]);
			else items.push(i);
		});
		if (filters) items = items.filter((i) => filters.every((f) => f(i, this._name)));

		return items;
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
			const newLinkthis = category.getProp("refs")?.[logicPath.slice(startsRefLink.length)];
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
		const filter = filters.find((f) => !f(article, this._name) && (f as any).errorArticle);
		if (filter) return (filter as any).errorArticle as Article;
	}

	private _testArticle(article: Article, filters: ArticleFilter[]) {
		return !filters || filters.every((f) => f(article, this._name));
	}

	private _convertToChangeCatalog(items: ItemStatus[]): ChangeCatalog[] {
		return items.map((item) => ({
			catalog: this,
			type: item.type,
			itemRef: item.itemRef,
		}));
	}
}

export type ItemFilter = (item: Item, catalogName: string) => boolean;
export type ArticleFilter = (article: Article, catalogName: string) => boolean;
export type CategoryFilter = (category: Category, catalogName: string) => boolean;

export type CatalogErrors = {
	[catalogErrorGroup in CatalogErrorGroups]?: CatalogError[];
};

export interface CatalogError {
	code: string;
	message: string;
	args?: CatalogErrorArgs;
}

export interface CatalogErrorArgs {
	linkTo: string;
	editorLink: string;
	title: string;
	logicPath: string;
}

export interface ChangeCatalog {
	catalog: Catalog;
	itemRef: ItemRef;
	type: FileStatus;
}

type WatcherFunc = (changes: ChangeCatalog[]) => void;
