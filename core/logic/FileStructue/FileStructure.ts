import { CATEGORY_ROOT_FILENAME, CATEGORY_ROOT_REGEXP, DOC_ROOT_FILENAME, DOC_ROOT_REGEXP } from "@app/config/const";
import { createEventEmitter, type Event, type EventArgs } from "@core/Event/EventEmitter";
import type MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import FileInfo from "@core/FileProvider/model/FileInfo";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import { Article, type ArticleProps } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import type CatalogEvents from "@core/FileStructue/Catalog/CatalogEvents";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import { Category, type CategoryProps } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import { resolveLanguage } from "@ext/localization/core/model/Language";
import matter from "gray-matter";
import * as yaml from "js-yaml";

export type FSLazyLoadCatalog = (entry: CatalogEntry) => Promise<Catalog>;

export type FSEvents = Event<
	"before-catalog-entry-read",
	{ path: Path; checkIsExists: boolean; initProps: CatalogProps }
> &
	Event<"catalog-entry-read", { entry: CatalogEntry }> &
	Event<"catalog-read", { fs: FileStructure; catalog: Catalog }> &
	Event<"item-filter", { fs: FileStructure; item: Item; parent: Category; catalogProps: CatalogProps }> &
	Event<"item-save", { item: Item }> &
	Event<"catalog-save", { catalog: Catalog }> &
	Event<"item-moved", EventArgs<CatalogEvents, "item-moved">> &
	Event<"item-deleted", EventArgs<CatalogEvents, "item-deleted">> &
	Event<"item-created", EventArgs<CatalogEvents, "item-created">> &
	Event<"item-serialize", { mutable: { content: string; props: ArticleProps } }> &
	Event<"before-item-create", { catalog: Catalog; mutableItem: { item: Item } }> &
	Event<"item-order-updated", EventArgs<CatalogEvents, "item-order-updated">> &
	Event<"item-props-updated", EventArgs<CatalogEvents, "item-props-updated">>;

export type FSProps = { [key: string]: any };

export type MarkdownProps = {
	props: ArticleProps;
	content: string;
};

const functionalFolders = [".git", ".idea", ".vscode", "node_modules", ".DS_Store"];
export const FS_EXCLUDE_FILENAMES = [
	...functionalFolders,
	".snippets", // legacy
	".icons",
	".gramax",
];
export const FS_EXCLUDE_CATALOG_NAMES = [
	...functionalFolders,
	"IndexCaches", // Legacy
	".storage",
	".workspace",
];

export default class FileStructure {
	private _events = createEventEmitter<FSEvents>();

	constructor(private _fp: MountFileProvider, private _isReadOnly: boolean) {}

	static isCatalog(path: Path): boolean {
		return DOC_ROOT_REGEXP.test(path.toString());
	}

	static isCategory(path: string): boolean {
		return !!path.match(CATEGORY_ROOT_REGEXP)?.[1];
	}

	static getCatalogPath(catalog: Catalog): Path {
		return new Path(catalog.name);
	}

	static async getCatalogDirs(fp: FileProvider): Promise<FileInfo[]> {
		const items = await fp.getItems(Path.empty);
		const predicate = (i: FileInfo) =>
			i.isDirectory() && !i.name.startsWith(".") && !FS_EXCLUDE_CATALOG_NAMES.includes(i.name);
		return items.filter(predicate);
	}

	get fp() {
		return this._fp;
	}

	get events() {
		return this._events;
	}

	async getCatalogEntries(): Promise<CatalogEntry[]> {
		const dirs = await FileStructure.getCatalogDirs(this._fp);
		const catalogs = await Promise.all(dirs.map((dir) => this.getCatalogEntryByPath(dir.path)));
		return catalogs.filter((c) => c);
	}

	async getCatalogByPath(path: Path, checkIsExists = true): Promise<Catalog> {
		const entry = await this.getCatalogEntryByPath(path, checkIsExists, {});
		return await entry.load();
	}

	async getCatalogEntryByPath(path: Path, checkIsExists = true, initProps: CatalogProps = {}): Promise<CatalogEntry> {
		await this._events.emit("before-catalog-entry-read", { path, checkIsExists, initProps });

		const docroot = await this._search(path, DOC_ROOT_REGEXP);

		if (checkIsExists && !(docroot || (await this.fp.exists(path)))) return;

		const props: CatalogProps = docroot ? await this._parseYaml(docroot) : this._defaultProps(path);
		const name = path.nameWithExtension;

		const ref = this._fp.getItemRef(docroot ?? path.join(new Path(DOC_ROOT_FILENAME)));
		const entry = new CatalogEntry({
			name,
			rootCaterogyRef: ref,
			basePath: path,
			props: { ...initProps, ...props },
			load: (entry) => this._getCatalogByEntry(entry),
			isReadOnly: this._isReadOnly,
		});

		await this._events.emit("catalog-entry-read", { entry });
		return entry;
	}

	async createCatalog(props: CatalogEditProps, base?: Path): Promise<Catalog> {
		const url = new Path(props.url);
		const path = base ? url.join(base) : url;
		delete props.url;

		await this._fp.mkdir(path);
		await this._fp.write(path.join(new Path(DOC_ROOT_FILENAME)), this._serializeProps(props));

		const entry = await this.getCatalogEntryByPath(url);
		return await entry.load();
	}

	async createCategory(path: Path, parent: Category, article?: Article, catalog?: Catalog): Promise<Category> {
		const shouldWriteIndex =
			!catalog?.props?.optionalCategoryIndex ||
			article?.content ||
			(article?.props && Object.values(article.props).filter(Boolean).length);

		shouldWriteIndex
			? await this._fp.write(path, article ? this._serializeArticle(article) : "")
			: await this._fp.mkdir(path.parentDirectoryPath);

		return await this.makeCategory(path.parentDirectoryPath, parent, catalog, shouldWriteIndex ? path : null);
	}

	async createArticle(path: Path, parent: Category, initProps?: ArticleProps, catalog?: Catalog): Promise<Article> {
		const { props, content } = this.parseMarkdown(await this._fp.read(path));

		const stat = await this._fp.getStat(path);
		const article = this.makeArticleByProps(path, initProps || props, content, parent, stat.mtimeMs, catalog);

		return article;
	}

	async moveArticle(article: Article, path: Path): Promise<void> {
		await this._fp.move(article.ref.path, path);
	}

	async moveCategory(category: Category, path: Path): Promise<void> {
		await this._fp.move(category.ref.path.parentDirectoryPath, path);
	}

	async saveCatalog(catalog: Catalog): Promise<void> {
		const props = catalog.props;
		delete props.docroot;
		delete props.docrootIsNoneExistent;
		const text = this._serializeProps({ ...props });
		await this._fp.write(catalog.getRootCategoryPath().join(new Path(DOC_ROOT_FILENAME)), text);
		catalog.repo?.resetCachedStatus();
	}

	async saveArticle(path: Path, content: string, props: ArticleProps): Promise<FileInfo> {
		const mutable = { content, props };
		await this.events.emit("item-serialize", { mutable });
		const text = this.serialize({ props: mutable.props, content: mutable.content });
		await this._fp.write(path, text);
		return await this._fp.getStat(path);
	}

	makeArticleByProps(
		path: Path,
		props: ArticleProps,
		content: string,
		parent: Category,
		lastModified: number,
		catalog?: Catalog,
	): Article {
		const articleCodeInCategory = parent.folderPath.subDirectory(path).stripDotsAndExtension;
		const logicPath = Path.join(parent.logicPath, articleCodeInCategory);

		props = props ?? {};

		const article = this._createArticleByProps(props, parent, path, logicPath, content, lastModified, catalog);
		return article;
	}

	async makeCategory(path: Path, parent: Category, catalog: Catalog, indexPath?: Path): Promise<Category> {
		const parsed = indexPath ? this.parseMarkdown(await this._fp.read(indexPath)) : { props: {}, content: "" };
		return await this._makeCategoryByProps(parsed.props, path, parsed.content, parent, catalog, indexPath);
	}

	parseMarkdown(content: string): MarkdownProps {
		let md: matter.GrayMatterFile<string>;
		try {
			md = matter(content, {});
			if (md.data && typeof md.data != "object") throw "Wrong format";
		} catch (e) {
			console.error("Invalid matter in markdown", content, e);
			return { props: {}, content: "" };
		}
		return { props: md.data as ArticleProps, content: md.content.trim() };
	}

	serialize(props: MarkdownProps): string {
		return `---\n${this._serializeProps(props.props)}---\n\n${props.content}`;
	}

	private async _getCatalogByEntry(entry: CatalogEntry): Promise<Catalog> {
		if (!entry) throw new Error("cannot resolve catalog from entry; entry is undefined");

		const category = new Category({
			ref: this._fp.getItemRef(entry.getRootCategoryRef().path),
			parent: null,
			content: null,
			props: entry.props,
			items: [],
			logicPath: entry.name,
			directory: entry.getRootCategoryDirectoryPath(),
			fs: this,
			lastModified: 0,
		});

		const catalog = new Catalog({
			name: entry.name,
			root: category,
			rootCaterogyRef: category.ref,
			basePath: entry.basePath,
			fs: this,
			fp: this._fp,
			isReadOnly: this._isReadOnly,
		});

		await this._readCategoryItems(entry.getRootCategoryDirectoryPath(), category, catalog);

		catalog.bindItemEvents();

		catalog.events.on("item-moved", (args) => this.events.emit("item-moved", args));
		catalog.events.on("item-created", (args) => this.events.emit("item-created", args));
		catalog.events.on("item-deleted", (args) => this.events.emit("item-deleted", args));
		catalog.events.on("item-props-updated", (args) => this.events.emit("item-props-updated", args));
		catalog.events.on("item-order-updated", (args) => this.events.emit("item-order-updated", args));

		await this.events.emit("catalog-read", { fs: this, catalog });

		return catalog;
	}

	private async _makeCategoryByProps(
		props: CategoryProps,
		path: Path,
		content: string,
		parent: Category,
		catalog: Catalog,
		indexPath?: Path,
	): Promise<Category> {
		const logicPath = Path.join(
			parent.logicPath,
			indexPath
				? parent.ref.path.parentDirectoryPath.subDirectory(indexPath.parentDirectoryPath).value
				: path.name,
		);

		const category = new Category({
			ref: this._fp.getItemRef(indexPath ?? path.join(new Path(CATEGORY_ROOT_FILENAME))),
			parent,
			content,
			props,
			logicPath,
			directory: path,
			items: [],
			lastModified: 0,
			fs: this,
		});
		await this._readCategoryItems(path, category, catalog);
		return category;
	}

	private async _readCategory(folderPath: Path, parentCategory: Category, catalog: Catalog): Promise<void> {
		const indexPath = folderPath.join(new Path(CATEGORY_ROOT_FILENAME));
		const hasIndex = await this._fp.exists(indexPath);

		if (!hasIndex && !catalog.props.optionalCategoryIndex)
			return await this._readCategoryItems(folderPath, parentCategory, catalog);

		if (!hasIndex) {
			const hasArticles = await this._search(folderPath, /\.md$/, 3);
			if (!hasArticles) return;
		}

		const category = await this.makeCategory(folderPath, parentCategory, catalog, hasIndex ? indexPath : null);

		if (!hasIndex) category.props.shouldBeCreated = true;

		const passFilter = await this.events.emit("item-filter", {
			fs: this,
			catalogProps: catalog.props,
			parent: parentCategory,
			item: category,
		});

		if (passFilter) parentCategory.items.push(category);
	}

	private async _readCategoryItems(folderPath: Path, category: Category, catalog: Catalog) {
		const files = await this._fp.getItems(folderPath);

		const mdFiles = files.filter((f) => {
			return !f.isDirectory() && f.name.match(/\.md$/) && !FileStructure.isCategory(f.name);
		});

		const articles = await Promise.all(
			mdFiles.map(async (f) => {
				const article = await this._makeArticle(f.path, category, catalog);
				if (!article) return null;

				const filter = await this.events.emit("item-filter", {
					fs: this,
					catalogProps: catalog.props,
					parent: category,
					item: article,
				});

				return filter ? article : null;
			}),
		);

		category.items.push(...articles.filter((article) => article !== null));

		const directories = files.filter((f) => f.isDirectory() && !FS_EXCLUDE_FILENAMES.includes(f.name));
		for (const f of directories) await this._readCategory(f.path, category, catalog);
		await category.sortItems();
	}

	private async _makeArticle(path: Path, parentCategory: Category, catalog: Catalog): Promise<Article> {
		const { props, content } = this.parseMarkdown(await this._fp.read(path));
		const articleCodeInCategory = parentCategory.folderPath.subDirectory(path).name;

		const logicPath = Path.join(parentCategory.logicPath, articleCodeInCategory);
		const article = this._createArticleByProps(props, parentCategory, path, logicPath, content, null, catalog);

		return article;
	}

	private _createArticleByProps(
		props: ArticleProps,
		parent: Category,
		path: Path,
		logicPath: string,
		content: string,
		lastModified?: number,
		catalog?: Catalog,
	): Article {
		const initProps = {
			ref: this._fp.getItemRef(path),
			parent,
			fs: this,
			lastModified: lastModified || 0,
			content,
			logicPath,
		};

		const mutableItem = { item: new Article({ ...initProps, props }) };
		this.events.emitSync("before-item-create", { catalog, mutableItem });

		return mutableItem.item;
	}

	private async _search(root: Path, search: RegExp, depth = 5): Promise<Path> {
		const queue = [];
		const explored = new Set<string>();
		let path: Path;

		path = await this._explore(search, root, queue, explored, 0);
		while (queue.length > 0 && !path) {
			const node = queue.shift();
			if (node.depth >= depth) continue;
			path = await this._explore(search, node.path, queue, explored, node.depth);
		}
		return path;
	}

	private async _explore(
		search: RegExp,
		target: Path,
		queue: { path: Path; depth: number }[],
		explored: Set<string>,
		depth: number,
		collectAll = false,
	): Promise<Path> {
		if (explored.has(target.value)) return;
		explored.add(target.value);

		const dirs = await this._fp.readdir(target).catch(() => []);
		if (!dirs) return;

		for (const entry of dirs.filter((filename) => !FS_EXCLUDE_FILENAMES.includes(filename))) {
			const path = target.join(new Path(entry));
			if (explored.has(path.value)) continue;

			const stat = await this._fp.getStat(path).catch(() => undefined);
			if (!stat) {
				if (collectAll) continue;
				else return;
			}

			if (stat.isDirectory()) {
				queue.push({ path, depth: depth + 1 });
				continue;
			}

			if (stat.isFile() && search.test(entry)) {
				return path;
			}
		}
	}

	private async _parseYaml(path: Path): Promise<CatalogProps> {
		let props;
		try {
			props = yaml.load(await this._fp.read(path)) ?? {};
			if (typeof props != "object") throw "Wrong format";
		} catch (e) {
			console.error("yaml invalid", e);
			props = {};
		}
		return props;
	}

	private _defaultProps(path: Path): CatalogProps {
		return {
			title: path.name,
			optionalCategoryIndex: true,
			docrootIsNoneExistent: true,
		};
	}

	private _serializeArticle(article: Article): string {
		return this.serialize({ props: article.props, content: article.content });
	}

	private _serializeProps(props: FSProps): string {
		const p = Object.fromEntries(Object.entries(props).filter(([, v]) => !!v));
		delete p.welcome;
		if (p.lang == resolveLanguage()) delete p.lang;
		return yaml.dump(p, { quotingType: '"' });
	}
}
