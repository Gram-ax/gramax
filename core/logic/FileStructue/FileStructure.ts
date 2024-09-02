import { CATEGORY_ROOT_REGEXP, DOC_ROOT_FILENAME, DOC_ROOT_REGEXP } from "@app/config/const";
import { createEventEmitter, type Event, type EventArgs } from "@core/Event/EventEmitter";
import Path from "@core/FileProvider/Path/Path";
import FileInfo from "@core/FileProvider/model/FileInfo";
import FileProvider from "@core/FileProvider/model/FileProvider";
import { Article, type ArticleProps } from "@core/FileStructue/Article/Article";
import { Catalog, type CatalogEvents, type CatalogProps } from "@core/FileStructue/Catalog/Catalog";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import { Category, type CategoryProps } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import { CatalogErrors } from "@ext/healthcheck/logic/Healthcheck";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import matter from "gray-matter";
import * as yaml from "js-yaml";

export type FSRule = (item: Item, catalogProps: FSProps, isRootCategory?: boolean) => void;
export type FSFilterRule = (parent: Category, catalogProps: FSProps, item: Item) => void;
export type FSSaveRule = (catalogProps: CatalogProps) => CatalogProps;
export type FSArticleSaveRule = (articleProps: ArticleProps) => ArticleProps;
export type FSLazyLoadCatalog = (entry: CatalogEntry) => Promise<Catalog>;

export type FSEvents = Event<"catalog-entry-read", { entry: CatalogEntry }> &
	Event<"catalog-read", { fs: FileStructure; catalog: Catalog }> &
	Event<"item-filter", { fs: FileStructure; item: Item; parent: Category; catalogProps: CatalogProps }> &
	Event<"item-save", { item: Item }> &
	Event<"catalog-save", { catalog: Catalog }> &
	Event<"item-moved", EventArgs<CatalogEvents, "item-moved">> &
	Event<"item-deleted", EventArgs<CatalogEvents, "item-deleted">> &
	Event<"item-created", EventArgs<CatalogEvents, "item-created">> &
	Event<"item-order-updated", EventArgs<CatalogEvents, "item-order-updated">> &
	Event<"item-props-updated", EventArgs<CatalogEvents, "item-props-updated">>;

export type FSProps = { [key: string]: any };

export type MarkdownProps = {
	props: ArticleProps;
	content: string;
};

export const FS_EXCLUDE_FILENAMES = [".git", ".idea", ".vscode", "node_modules", ".snippets"];
export const FS_EXCLUDE_CATALOG_NAMES = [
	"IndexCaches", // Legacy
	".storage",
];

export default class FileStructure {
	private _rules: FSRule[] = [];
	private _saveRules: FSSaveRule[] = [];
	private _articleSaveRules: FSArticleSaveRule[] = [];
	private _events = createEventEmitter<FSEvents>();

	constructor(private _fp: FileProvider, private _isServerApp: boolean) {}

	get fp() {
		return this._fp;
	}

	get events() {
		return this._events;
	}

	addSaveRule(rule: FSSaveRule) {
		this._saveRules.push(rule);
	}

	addArticleSaveRule(rule: FSArticleSaveRule) {
		this._articleSaveRules.push(rule);
	}

	addRule(rule: FSRule) {
		this._rules.push(rule);
	}

	static isCatalog(path: Path): boolean {
		return DOC_ROOT_REGEXP.test(path.toString());
	}

	static isCategory(path: string): boolean {
		return !!path.match(CATEGORY_ROOT_REGEXP)?.[1];
	}

	static getCatalogPath(catalog: Catalog): Path {
		return new Path(catalog.getName());
	}

	getItemRef(path: Path): ItemRef {
		return this._fp.getItemRef(path);
	}

	async getCatalogEntries(): Promise<CatalogEntry[]> {
		const items = await this._fp.getItems(Path.empty);
		const promises = items
			.filter((i) => i.isDirectory() && !FS_EXCLUDE_CATALOG_NAMES.includes(i.name))
			.map((i) => this.getCatalogEntryByPath(i.path));
		const catalogs = await Promise.all(promises);
		return catalogs.filter((c) => c);
	}

	async getCatalogsByEntries(entries: CatalogEntry[]): Promise<Catalog[]> {
		const catalogs = [];
		for (const entry of entries) catalogs.push(await entry.load());
		return catalogs;
	}

	async getCatalogByPath(path: Path): Promise<Catalog> {
		const entry = await this.getCatalogEntryByPath(path);
		return await entry.load();
	}

	async getCatalogEntryByPath(path: Path): Promise<CatalogEntry> {
		const docroot = await this._search(path, DOC_ROOT_REGEXP);

		if (!(docroot || (await this.fp.exists(path)))) return;

		const errors: CatalogErrors = {};
		const props = docroot
			? await this._parseYaml(docroot, errors, `${DOC_ROOT_FILENAME} is invalid: `)
			: this._defaultProps(path);
		const name = path.name;

		const ref = this._fp.getItemRef(docroot ?? path.join(new Path(DOC_ROOT_FILENAME)));
		const entry = new CatalogEntry({
			name,
			rootCaterogyRef: ref,
			basePath: path,
			props,
			errors,
			load: (entry) => this.getCatalogByEntry(entry),
			isServerApp: this._isServerApp,
		});

		await this._events.emit("catalog-entry-read", { entry });

		return entry;
	}

	async getCatalogByEntry(entry: CatalogEntry): Promise<Catalog> {
		if (!entry) return;

		const stat = await this._fp.getStat(entry.getRootCategoryPath());
		const category = new Category({
			ref: this.getItemRef(entry.getRootCategoryRef().path),
			parent: null,
			content: null,
			props: {
				...entry.props,
				order: 0,
			},
			items: [],
			logicPath: entry.getName(),
			directory: entry.getRootCategoryPath(),
			fs: this,
			lastModified: stat.mtimeMs,
		});

		this._rules.forEach((rule) => rule(category, entry.props, true));

		await this._readCategoryItems(entry.getRootCategoryPath(), category, entry.props, entry.errors);

		const catalog = new Catalog({
			name: entry.getName(),
			props: entry.props,
			root: category,
			errors: entry.errors,
			basePath: entry.getBasePath(),
			rootPath: this._fp.rootPath,
			fs: this,
			fp: this._fp,
			isServerApp: this._isServerApp,
		});

		catalog.events.on("item-moved", (args) => this.events.emit("item-moved", args));
		catalog.events.on("item-created", (args) => this.events.emit("item-created", args));
		catalog.events.on("item-deleted", (args) => this.events.emit("item-deleted", args));
		catalog.events.on("item-props-updated", (args) => this.events.emit("item-props-updated", args));
		catalog.events.on("item-order-updated", (args) => this.events.emit("item-order-updated", args));

		await this.events.emit("catalog-read", { fs: this, catalog });

		return catalog;
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

	async createCategory(
		path: Path,
		parent: Category,
		article?: Article,
		props?: CatalogProps,
		errors?: CatalogErrors,
	): Promise<Category> {
		await this._fp.write(path, article ? this._serializeArticle(article) : "");
		const category = await this.makeCategory(path.parentDirectoryPath, parent, props, errors, path);
		return category;
	}

	async moveArticle(article: Article, path: Path): Promise<void> {
		await this._fp.move(article.ref.path, path);
	}

	async moveCategory(category: Category, path: Path): Promise<void> {
		await this._fp.move(category.ref.path.parentDirectoryPath, path);
	}

	async createArticle(
		path: Path,
		parent: Category,
		catalogProps?: FSProps,
		errors?: CatalogErrors,
	): Promise<Article> {
		const { props, content } = this.parseMarkdown(await this._fp.read(path), path, errors);

		const stat = await this._fp.getStat(path);
		const article = this.makeArticleByProps(path, props, content, parent, catalogProps, stat.mtimeMs);

		this._rules.forEach((rule) => rule(article, catalogProps));

		return article;
	}

	async saveCatalog(catalog: Catalog): Promise<void> {
		let props = catalog.props;
		this._saveRules.forEach((rule) => (props = rule(props)));
		delete props.docroot;
		const text = this._serializeProps({ ...props });
		await this._fp.write(catalog.getRootCategoryPath().join(new Path(DOC_ROOT_FILENAME)), text);
	}

	async saveArticle(article: Article): Promise<FileInfo> {
		const text = this._serializeArticle(article);
		await this._fp.write(article.ref.path, text);
		return await this._fp.getStat(article.ref.path);
	}

	makeArticleByProps(
		path: Path,
		props: ArticleProps,
		content: string,
		parent: Category,
		catalogProps: FSProps,
		lastModified: number,
	): Article {
		const articleCodeInCategory = parent.folderPath.subDirectory(path).stripDotsAndExtension;
		const logicPath = Path.join(parent.logicPath, articleCodeInCategory);

		const article = new Article({
			ref: this.getItemRef(path),
			parent,
			props: props ?? {},
			content,
			logicPath,
			fs: this,
			lastModified,
		});

		this._rules.forEach((rule) => rule(article, catalogProps));
		return article;
	}

	async makeCategory(
		path: Path,
		parent: Category,
		props: CatalogProps,
		errors: CatalogErrors,
		indexPath: Path,
	): Promise<Category> {
		const parsed = indexPath
			? this.parseMarkdown(await this._fp.read(indexPath), indexPath, errors)
			: { props: null, content: null };

		return await this._makeCategoryByProps(parsed.props, path, parsed.content, parent, props, errors, indexPath);
	}

	parseMarkdown(content: string, path?: Path, errors?: CatalogErrors): MarkdownProps {
		let md: matter.GrayMatterFile<string>;
		try {
			md = matter(content, {});
			if (md.data && typeof md.data != "object") throw "Wrong format";
		} catch (e) {
			if (errors) {
				if (errors.FileStructure) errors.FileStructure = [];
				errors.FileStructure?.push({
					code: "YAML error",
					message: `Invalid matter in markdown file${path ? " " + path : ""}: ${e.message ?? ""}`,
				});
			}
			return { props: {}, content: "" };
		}
		return { props: md.data as ArticleProps, content: md.content.trim() };
	}

	serialize(props: any, content: string): string {
		return `---\n${this._serializeProps(props)}---\n\n` + content;
	}

	private async _makeArticle(
		path: Path,
		parentCategory: Category,
		catalogProps: CatalogProps,
		catalogErrors: CatalogErrors,
	): Promise<Article> {
		const { props, content } = this.parseMarkdown(await this._fp.read(path), path, catalogErrors);
		const articleCodeInCategory = parentCategory.folderPath.subDirectory(path).name;

		const logicPath = Path.join(parentCategory.logicPath, articleCodeInCategory);
		const stat = await this._fp.getStat(path);
		const article = new Article({
			ref: this.getItemRef(path),
			parent: parentCategory,
			props: props ?? {},
			content,
			logicPath,
			fs: this,
			lastModified: stat.mtimeMs,
		});

		this._rules.forEach((r) => r(article, catalogProps));
		return article;
	}

	private async _makeCategoryByProps(
		props: CategoryProps,
		path: Path,
		content: string,
		parent: Category,
		catalogProps: CatalogProps,
		errors: CatalogErrors,
		indexPath: Path,
	): Promise<Category> {
		const logicPath = Path.join(
			parent.logicPath,
			parent.ref.path.parentDirectoryPath.subDirectory(indexPath?.parentDirectoryPath).value,
		);

		const stat = await this._fp.getStat(indexPath);
		const category = new Category({
			ref: this._fp.getItemRef(indexPath),
			parent,
			content,
			props,
			logicPath,
			directory: path,
			items: [],
			lastModified: stat.mtimeMs,
			fs: this,
		});
		this._rules.forEach((rule) => rule(category, catalogProps));
		await this._readCategoryItems(path, category, catalogProps, errors);
		return category;
	}

	private async _readCategory(
		folderPath: Path,
		parentCategory: Category,
		catalogProps: CatalogProps,
		catalogErrors: CatalogErrors,
	): Promise<void> {
		const files = await this._fp.getItems(folderPath);
		let categories = [parentCategory];

		const indexes = files.filter(
			(f) => !FS_EXCLUDE_FILENAMES.includes(f.name) && f.isFile() && FileStructure.isCategory(f.name),
		);

		if (!indexes?.length) {
			await Promise.all(
				categories.map((category) =>
					this._readCategoryItems(folderPath, category, catalogProps, catalogErrors),
				),
			);
			return;
		}

		categories = await Promise.all(
			indexes.map(
				async (categoryIndexFile) =>
					await this.makeCategory(
						folderPath,
						parentCategory,
						catalogProps,
						catalogErrors,
						categoryIndexFile?.path,
					),
			),
		);

		for (const category of categories) {
			const filter = await this._events.emit("item-filter", {
				fs: this,
				item: category,
				parent: parentCategory,
				catalogProps,
			});

			if (!filter) continue;
			parentCategory.items.push(category);
		}
	}

	private async _readCategoryItems(
		folderPath: Path,
		category: Category,
		catalogProps: CatalogProps,
		catalogErrors: CatalogErrors,
	) {
		const files = await this._fp.getItems(folderPath);
		await Promise.all(
			files
				.filter((f) => !f.isDirectory() && f.name.match(/\.md$/) && !FileStructure.isCategory(f.name))
				.map(async (f) => {
					const article = await this._makeArticle(f.path, category, catalogProps, catalogErrors);
					if (!article) return;
					const filter = await this.events.emit("item-filter", {
						fs: this,
						catalogProps,
						parent: category,
						item: article,
					});
					if (!filter) return;
					category.items.push(article);
				}),
		);

		await Promise.all(
			files
				.filter((f) => f.isDirectory() && !FS_EXCLUDE_FILENAMES.includes(f.name))
				.map(async (f) => {
					await this._readCategory(f.path, category, catalogProps, catalogErrors);
				}),
		);

		await category.sortItems();
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

	private async _parseYaml(path: Path, errors: CatalogErrors, errorMessage: string): Promise<CatalogProps> {
		let props;
		try {
			props = yaml.load(await this._fp.read(path)) ?? {};
			if (typeof props != "object") throw "Wrong format";
		} catch (e) {
			props = {};
			if (errors.FileStructure) errors.FileStructure = [];
			errors.FileStructure?.push({
				code: "YAML error",
				message: errorMessage + (e.message ?? ""),
			});
		}
		return props;
	}

	private _defaultProps(path: Path): CatalogProps {
		return {
			title: path.name,
		};
	}

	private _serializeArticle(article: Article): string {
		let props = article.props;
		this._articleSaveRules.forEach((rule) => (props = rule(props)));
		return this.serialize(props, article.content);
	}

	private _serializeProps(props: FSProps): string {
		const p = { ...props };
		delete p.welcome;
		if (p.lang == defaultLanguage) delete p.lang;
		return yaml.dump(p, { quotingType: '"' });
	}
}
