import Path from "@core/FileProvider/Path/Path";
import FileInfo from "@core/FileProvider/model/FileInfo";
import FileProvider from "@core/FileProvider/model/FileProvider";
import { Article } from "@core/FileStructue/Article/Article";
import ArticleFileStructure from "@core/FileStructue/Article/ArticleFileStructure";
import { Catalog, CatalogErrors } from "@core/FileStructue/Catalog/Catalog";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import CatalogFileStructure from "@core/FileStructue/Catalog/CatalogFileStructure";
import { Category } from "@core/FileStructue/Category/Category";
import CategoryFileStructure from "@core/FileStructue/Category/CategoryFileStructure";
import { Item, ItemRef } from "@core/FileStructue/Item/Item";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import matter from "gray-matter";
import * as yaml from "js-yaml";

export type FSRule = (item: Item, catalogProps: FSProps, isRootCategory?: boolean) => void;
export type FSFilterRule = (parent: Category, catalogProps: FSProps, item: Item) => void;
export type FSSaveRule = (catalogProps: FSProps) => FSProps;
export type FSArticleSaveRule = (articleProps: FSProps) => FSProps;
export type FSLazyLoadCatalog = (entry: CatalogEntry) => Promise<Catalog>;

export type FSProps = { [key: string]: any };

export type MarkdownProps = {
	props: FSProps;
	content: string;
};

export const DOC_ROOT_FILENAME = ".doc-root.yaml";
export const DOC_ROOT_REGEXP = /.(doc-)?root.yaml/;
export const NEW_ARTICLE_NAME = "newArticle";
export const NEW_ARTICLE_FILENAME = NEW_ARTICLE_NAME + ".md";
export const CATEGORY_ROOT_FILENAME = "_index.md";
export const CATEGORY_ROOT_REGEXP = /(_index_\w\w\.md$|_index\.md$)/;
export const FS_EXCLUDE_FILENAMES = [".git", ".idea", ".vscode", "node_modules"];

export default class FileStructure implements CatalogFileStructure, CategoryFileStructure, ArticleFileStructure {
	private _saveRules: FSSaveRule[] = [];
	private _articleSaveRules: FSArticleSaveRule[] = [];
	private _filterRules: FSFilterRule[] = [];
	private _rules: FSRule[] = [];

	constructor(private _fp: FileProvider) {}

	get fp() {
		return this._fp;
	}

	addSaveRule(rule: FSSaveRule) {
		this._saveRules.push(rule);
	}

	addArticleSaveRule(rule: FSArticleSaveRule) {
		this._articleSaveRules.push(rule);
	}

	addFilterRule(rule: FSFilterRule) {
		this._filterRules.push(rule);
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
		const promises = items.filter((i) => i.isDirectory()).map((i) => this.getCatalogEntryByPath(i.path));
		const catalogs = await Promise.all(promises);
		return catalogs.filter((c) => c);
	}

	async getCatalogsByEntries(entries: CatalogEntry[]): Promise<Catalog[]> {
		const catalogs = [];
		for (const entry of entries) catalogs.push(await entry.catalog());
		return catalogs;
	}

	async getCatalogByPath(path: Path): Promise<Catalog> {
		const entry = await this.getCatalogEntryByPath(path);
		return await entry.catalog();
	}

	async getCatalogEntryByPath(path: Path): Promise<CatalogEntry> {
		const docroot = await this._search(path, DOC_ROOT_REGEXP);
		if (!docroot) return;

		const root = docroot.parentDirectoryPath;

		const errors: CatalogErrors = {};
		const props = await this._parseYaml(docroot, errors, `${DOC_ROOT_FILENAME} is invalid: `);
		const name = path.name;

		const ref = this._fp.getItemRef(root);
		return new CatalogEntry(name, ref, props, errors, (entry) => this.getCatalogByEntry(entry));
	}

	async getCatalogByEntry(entry: CatalogEntry): Promise<Catalog> {
		if (!entry) return;

		const stat = await this._fp.getStat(entry.ref.path);
		const ref = entry.ref.path.join(new Path(entry.ref.path.value == entry.name ? DOC_ROOT_FILENAME : entry.name));
		const category = new Category({
			ref: this.getItemRef(ref),
			parent: null,
			content: null,
			props: { ...entry.props },
			items: [],
			logicPath: entry.name,
			directory: entry.ref.path,
			fs: this,
			lastModified: stat.mtimeMs,
		});

		this._rules.forEach((rule) => rule(category, entry.props, true));
		await this._readCategoryItems(entry.ref.path, category, entry.props, entry.errors);

		return new Catalog({
			name: entry.name,
			props: entry.props,
			root: category,
			errors: entry.errors,
			basePath: new Path(entry.name),
			rootPath: this._fp.rootPath,
			fs: this,
			fp: this._fp,
			entry,
		});
	}

	async createCatalog(props: CatalogEditProps): Promise<Catalog> {
		const path = new Path(props.url);
		delete props.url;

		const docroot = path.join(new Path(DOC_ROOT_FILENAME));
		await this._fp.write(docroot, this._serializeProps(props));

		const articlePath = path.join(new Path(NEW_ARTICLE_FILENAME));
		const article = new CustomArticlePresenter().getArticle(NEW_ARTICLE_NAME);

		await this._fp.write(articlePath, this._serializeArticle(article));
		const entry = await this.getCatalogEntryByPath(path);
		return await entry.catalog();
	}

	async createCategory(
		path: Path,
		parent: Category,
		article: Article,
		props?: FSProps,
		errors?: CatalogErrors,
	): Promise<Category> {
		await this._fp.write(path, this._serializeArticle(article));
		const category = await this.makeCategory(path.parentDirectoryPath, parent, props, errors, path);
		return category;
	}

	async setArticlePath(article: Article, path: Path): Promise<void> {
		await this._fp.move(article.ref.path, path);
	}

	async setCategoryPath(category: Category, path: Path): Promise<void> {
		await this._fp.move(category.ref.path.parentDirectoryPath, path);
	}

	async createArticle(path: Path, parent: Category, props?: FSProps, errors?: CatalogErrors): Promise<Article> {
		let md;
		try {
			md = matter(await this._fp.read(path), {});
			if (md.data && typeof md.data != "object") throw "Wrong format";
		} catch (e) {
			if (typeof errors == "undefined") errors = {};
			if (!errors.FileStructure) errors.FileStructure = [];
			errors.FileStructure?.push({
				code: "YAML error",
				message: `Invalid matter in markdown file ${path}: ${e.message ?? ""}`,
			});
			return null;
		}

		const stat = await this._fp.getStat(path);
		const article: Article = this.makeArticleByProps(path, md.data, md.content, parent, props, stat.mtimeMs);

		this._rules.forEach((rule) => rule(article, props));

		return article;
	}

	async saveCatalog(catalog: Catalog): Promise<void> {
		const root = catalog.getRootCategory();
		let props = catalog.getProps();
		let rootProps = root.props;
		this._saveRules.forEach((rule) => {
			props = rule(props);
			rootProps = rule(rootProps);
		});
		const text = this._serializeProps({ ...rootProps.props, ...props });
		await this._fp.write(catalog.getRootCategoryPath().join(new Path(DOC_ROOT_FILENAME)), text);
	}

	async saveArticle(article: Article): Promise<FileInfo> {
		const text = this._serializeArticle(article);
		await this._fp.write(article.ref.path, text);
		return await this._fp.getStat(article.ref.path);
	}

	makeArticleByProps(
		path: Path,
		props: FSProps,
		content: string,
		parent: Category,
		catalogProps: FSProps,
		lastModified: number,
	): Article {
		const articleCodeInCategory = parent.folderPath.subDirectory(path).stripDotsAndExtension;
		const logicPath = Path.join(parent.logicPath, articleCodeInCategory);

		const article: Article = new Article({
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
		props: FSProps,
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
		return { props: md.data ? md.data : {}, content: md.content.trim() };
	}

	private async _makeArticle(
		path: Path,
		parentCategory: Category,
		catalogProps: FSProps,
		catalogErrors: CatalogErrors,
	): Promise<Article> {
		const { props, content } = this.parseMarkdown(await this._fp.read(path), path, catalogErrors);
		const articleCodeInCategory = parentCategory.folderPath.subDirectory(path).stripDotsAndExtension;

		const logicPath = Path.join(parentCategory.logicPath, articleCodeInCategory);
		const stat = await this._fp.getStat(path);
		const article: Article = new Article({
			ref: this.getItemRef(path),
			parent: parentCategory,
			props,
			content,
			logicPath,
			fs: this,
			lastModified: stat.mtimeMs,
		});

		this._rules.forEach((r) => r(article, catalogProps));
		return article;
	}

	private async _makeCategoryByProps(
		props: FSProps,
		path: Path,
		content: string,
		parent: Category,
		catalogProps: FSProps,
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
			props: props ?? {},
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
		catalogProps: FSProps,
		catalogErrors: CatalogErrors,
	): Promise<void> {
		const files = await this._fp.getItems(folderPath);
		let categories = [parentCategory];

		const indexes = files.filter((f) => !f.isDirectory() && FileStructure.isCategory(f.name));

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

		categories.forEach((category) => {
			if (this._filterRules.every((r) => r(parentCategory, catalogProps, category)))
				parentCategory.items.push(category);
		});
	}

	private async _readCategoryItems(
		folderPath: Path,
		category: Category,
		catalogProps: FSProps,
		catalogErrors: CatalogErrors,
	) {
		const files = await this._fp.getItems(folderPath);
		await Promise.all(
			files
				.filter(
					(f) =>
						!f.isDirectory() &&
						f.name.search(" ") == -1 &&
						f.name.match(/\.md$/) &&
						!FileStructure.isCategory(f.name),
				)
				.map(async (f) => {
					const article = await this._makeArticle(f.path, category, catalogProps, catalogErrors);
					if (article && this._filterRules.every((r) => r(category, catalogProps, article)))
						category.items.push(article);
				}),
		);

		await Promise.all(
			files
				.filter((f) => f.isDirectory())
				.map(async (f) => {
					await this._readCategory(f.path, category, catalogProps, catalogErrors);
				}),
		);

		await category.sortItems();
	}

	private async _search(root: Path, search: RegExp): Promise<Path> {
		const queue = [];
		const explored = [];
		let path: Path;

		path = await this._explore(search, root, queue, explored);
		while (queue.length > 0 && !path) {
			const node = queue.shift();
			path = await this._explore(search, node, queue, explored);
		}
		return path;
	}

	private async _explore(search: RegExp, target: Path, queue: Path[], explored: Path[]): Promise<Path> {
		explored[target.value] = true;
		const dirs = await this._fp.readdir(target);
		if (!dirs) return;

		for (const entry of dirs.filter((filename) => !FS_EXCLUDE_FILENAMES.includes(filename))) {
			const path = target.join(new Path(entry));
			if (explored[path.value]) continue;

			const stat = await this._fp.getStat(path);

			if (stat.isDirectory()) {
				queue.push(path);
				continue;
			}

			if (stat.isFile() && search.test(entry)) {
				return path;
			}
		}
	}

	private async _parseYaml(path: Path, errors: CatalogErrors, errorMessage: string): Promise<FSProps> {
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

	private _serializeArticle(article: Article): string {
		let props = article.props;
		this._articleSaveRules.forEach((rule) => (props = rule(props)));
		return `---\n${this._serializeProps(props)}---\n\n` + article.content;
	}

	private _serializeProps(props: FSProps): string {
		const p = { ...props };
		if (p.lang == defaultLanguage) delete p.lang;
		return yaml.dump(p, { quotingType: '"' });
	}
}
