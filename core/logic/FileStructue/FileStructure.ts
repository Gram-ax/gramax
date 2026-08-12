import {
	CATEGORY_ROOT_FILENAME,
	CATEGORY_ROOT_FILENAMES,
	CATEGORY_ROOT_REGEXP,
	DOC_ROOT_FILENAME,
	DOC_ROOT_FILENAMES,
	DOC_ROOT_REGEXP,
	WORKSPACE_CONFIG_FILENAME,
} from "@app/config/const";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import rustCall from "@app/resolveModule/rustcall";
import { createEventEmitter, type Event, type EventArgs } from "@core/Event/EventEmitter";
import type MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import type FileInfo from "@core/FileProvider/model/FileInfo";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Article, type ArticleProps } from "@core/FileStructue/Article/Article";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import type CatalogEvents from "@core/FileStructue/Catalog/CatalogEvents";
import { type CatalogProps, ExcludedProps } from "@core/FileStructue/Catalog/CatalogProps";
import { Category, type CategoryProps } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import { roundedOrderAfter } from "@core/FileStructue/Item/ItemOrderUtils";
import { uniqueName } from "@core/utils/uniqueName";
import type CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps";
import { resolveLanguage } from "@ext/localization/core/model/Language";
import { addEvent, Level, trace } from "@ext/loggers/opentelemetry";
import { feature } from "@ext/toggleFeatures/features";
import type GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import assert from "assert";
import matter from "gray-matter";
import * as yaml from "js-yaml";

export type FSLazyLoadCatalog = (entry: CatalogEntry) => Promise<Catalog>;

export type CollisionMovement = { oldPath: Path; newPath: Path };

export type FSEvents = Event<
	"before-catalog-entry-read",
	{ path: Path; checkIsExists: boolean; initProps: CatalogProps }
> &
	Event<"catalog-entry-read", { entry: CatalogEntry }> &
	Event<"catalog-read", { fs: FileStructure; catalog: Catalog }> &
	Event<"catalog-collision-healed", { fs: FileStructure; catalog: Catalog; movements: CollisionMovement[] }> &
	Event<"item-filter", { fs: FileStructure; item: Item; parent: Category; catalogProps: CatalogProps }> &
	Event<"category-filter", { fs: FileStructure; item: Item; parent: Category; catalogProps: CatalogProps }> &
	Event<"item-save", { item: Item }> &
	Event<"catalog-save", { catalog: Catalog }> &
	Event<"item-moved", EventArgs<CatalogEvents, "item-moved">> &
	Event<"item-deleted", EventArgs<CatalogEvents, "item-deleted">> &
	Event<"item-created", EventArgs<CatalogEvents, "item-created">> &
	Event<"item-serialize", { mutable: { content: string; props: ArticleProps } }> &
	Event<"before-item-create", { catalog: Catalog; mutableItem: { item: Item } }> &
	Event<"item-order-updated", EventArgs<CatalogEvents, "item-order-updated">> &
	Event<"item-props-updated", EventArgs<CatalogEvents, "item-props-updated">> &
	Event<"item-read", { catalog: Catalog; mutable: { content: string; props: ArticleProps } }>;

// biome-ignore lint/suspicious/noExplicitAny: generic props bag for serialization
export type FSProps = { [key: string]: any };

export type MarkdownProps = {
	props: ArticleProps;
	content: string;
};

export type WorkspaceEntryDto = {
	relPath: string;
	docrootRel: string | null;
	catalogProps: Partial<CatalogProps>;
	isGitRepo: boolean;
	isBareRepo: boolean;
	hasGitmodules: boolean;
};

export type ArticleNodeDto = {
	kind: "article";
	relPath: string;
	frontMatter: Partial<ArticleProps>;
	parseError: string | null;
};

export type CategoryNodeDto = {
	kind: "category";
	relPath: string;
	directory: string;
	hasIndex: boolean;
	frontMatter: Partial<CategoryProps>;
	children: NodeDto[];
};

export type NodeDto = ArticleNodeDto | CategoryNodeDto;

export type CatalogTreeDto = {
	docrootRel: string | null;
	catalogProps: Partial<CatalogProps>;
	children: NodeDto[];
};

const functionalFolders = [".git", ".idea", ".vscode", "node_modules", ".DS_Store"];
export const FS_EXCLUDE_FILENAMES = [
	...functionalFolders,
	".snippets", // legacy
	".icons",
	".gramax",
	".claude",
	".codex",
];
export const FS_EXCLUDE_CATALOG_NAMES = [
	...functionalFolders,
	"IndexCaches", // Legacy
	".storage",
	".workspace",
];

export default class FileStructure {
	private _events = createEventEmitter<FSEvents>();
	private _collisionMovements = new WeakMap<Catalog, CollisionMovement[]>();

	constructor(
		private _fp: MountFileProvider,
		private _isReadOnly: boolean,
		private _knownWorkspacePaths: string[] = [],
	) {}

	static isCatalog(path: Path): boolean {
		return DOC_ROOT_REGEXP.test(path.toString());
	}

	static isCategory(path: string): boolean {
		return !!path.match(CATEGORY_ROOT_REGEXP)?.[1];
	}

	static getCatalogPath(catalog: BaseCatalog): Path {
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

	@trace({ level: Level.Internal, omitResult: true })
	async getCatalogEntries(): Promise<CatalogEntry[]> {
		const native = feature("native-fs") ? await this._tryNativeScanWorkspace() : null;
		if (native) {
			addEvent("used-method", Level.Internal, { method: "native" });
			return await this._buildEntriesFromNative(native);
		}

		addEvent("used-method", Level.Internal, { method: "js" });
		return await this._getCatalogEntriesJs();
	}

	/**
	 * @deprecated Consider using FileStructue._tryNativeScanWorkspace
	 */
	@trace({ level: Level.Internal, omitArgs: true, omitResult: true })
	private async _getCatalogEntriesJs(): Promise<CatalogEntry[]> {
		const dirs = await FileStructure.getCatalogDirs(this._fp.default());
		const basePath = this._fp.rootPath;

		const filtered = (
			await dirs.mapAsync(async (dir) => {
				const workspaceFilePath = dir.path.join(new Path(WORKSPACE_CONFIG_FILENAME));
				const hasWorkspaceYaml = await this._fp.exists(workspaceFilePath);
				const dirAbsPath = basePath.join(new Path(dir.name));
				const isKnownWorkspace = this._knownWorkspacePaths.some((wp) => new Path(wp).startsWith(dirAbsPath));

				if (hasWorkspaceYaml || isKnownWorkspace) {
					addEvent("nested-workspace-skipped", Level.Internal, {
						dir: dir.name,
						reason: hasWorkspaceYaml ? "workspace.yaml" : "known-workspace-path",
					});
					return null;
				}

				return dir;
			})
		).filter(Boolean);

		const catalogs = await filtered.mapAsync((dir) => this.getCatalogEntryByPath(dir.path));
		return catalogs.filter((c) => c);
	}

	@trace({ level: Level.Internal, omitArgs: true, omitResult: true })
	private async _tryNativeScanWorkspace(): Promise<WorkspaceEntryDto[] | null> {
		const env = getExecutingEnvironment();
		if (env === "static" || env === "cli") return null;

		const entries = await rustCall<WorkspaceEntryDto[]>("fs.scan_workspace", {
			scope: { kind: this._fp.kind, root: this._fp.rootPath.value },
			path: "",
			opts: {
				excludeDirs: FS_EXCLUDE_CATALOG_NAMES,
				categoryIndexFilename: CATEGORY_ROOT_FILENAMES,
				docrootFilenames: DOC_ROOT_FILENAMES,
				workspaceConfigFilename: WORKSPACE_CONFIG_FILENAME,
				docrootSearchDepth: 5,
				optionalCategoryIndex: true,
				maxConcurrency: 1,
				followSymlinks: false,
				knownWorkspacePaths: this._knownWorkspacePaths,
			},
		});

		return entries;
	}

	@trace({ level: Level.Internal, omitArgs: true, omitResult: true })
	private async _buildEntriesFromNative(entries: WorkspaceEntryDto[]): Promise<CatalogEntry[]> {
		const out = await entries.mapAsync(async (e) => {
			const dirPath = new Path(e.relPath);
			const initProps: CatalogProps = {
				isGitRepo: e.isGitRepo,
				isBareRepo: e.isBareRepo,
				hasGitmodules: e.hasGitmodules,
			};

			// Bare repos: native scan walks disk and only sees `.git/` (excluded),
			// so the docroot is invisible. Defer to the JS path; its emit mounts gitfp
			// and the subsequent read goes through that mount.
			if (e.isBareRepo && !e.docrootRel) return await this.getCatalogEntryByPath(dirPath, true, initProps);

			await this._events.emit("before-catalog-entry-read", { path: dirPath, checkIsExists: true, initProps });

			const docrootPath = dirPath.join(new Path(e.docrootRel ?? DOC_ROOT_FILENAME));
			const props: CatalogProps = e.docrootRel ? e.catalogProps : this._defaultProps(dirPath);
			const entry = this._makeCatalogEntry(dirPath, docrootPath, { ...initProps, ...props });

			await this._events.emit("catalog-entry-read", { entry });
			return entry;
		});

		return out.filter(Boolean);
	}

	@trace({ level: Level.Internal })
	async getCatalogByPath(path: Path, checkIsExists = true): Promise<Catalog> {
		const env = getExecutingEnvironment();
		const useNative = feature("native-fs") && env !== "static" && env !== "cli";
		if (useNative) {
			const initProps: CatalogProps = {};
			// Mount the gitfp first (bare repos) so the scan below resolves `at(path)` to the git
			// provider and reads the docroot straight from the tree — a bare repo has no working
			// copy on disk, only `.git/`, so a pre-mount disk scan would find nothing.
			await this._events.emit("before-catalog-entry-read", { path, checkIsExists, initProps });

			const tree = await this._tryNativeScanCatalogByPath(path);
			if (tree) {
				addEvent("used-method", Level.Internal, { method: "native", scope: "catalog-by-path" });
				const entry = this._makeEntryFromTree(path, tree, initProps);
				await this._events.emit("catalog-entry-read", { entry });
				return await this._hydrateCatalogFromTree(entry, tree);
			}

			// Native scan unavailable (e.g. it threw) — fall back to the JS tree walk over the
			// now-mounted fp.
			addEvent("used-method", Level.Internal, { method: "js", scope: "catalog-by-path" });
			const entry = await this.getCatalogEntryByPath(path, checkIsExists, initProps);
			return await entry.load();
		}

		const entry = await this.getCatalogEntryByPath(path, checkIsExists, {});
		return await entry.load();
	}

	@trace({ level: Level.Internal })
	async getCatalogEntryByPath(path: Path, checkIsExists = true, initProps: CatalogProps = {}): Promise<CatalogEntry> {
		await this._events.emit("before-catalog-entry-read", { path, checkIsExists, initProps });

		const docroot = await this._search(path, DOC_ROOT_REGEXP);

		if (checkIsExists && !(docroot || (await this.fp.exists(path)))) return;

		const props: CatalogProps = docroot ? await this._parseYaml(docroot) : this._defaultProps(path);
		const docrootPath = docroot ?? path.join(new Path(DOC_ROOT_FILENAME));
		const entry = this._makeCatalogEntry(path, docrootPath, { ...initProps, ...props });

		await this._events.emit("catalog-entry-read", { entry });
		return entry;
	}

	private _makeCatalogEntry(basePath: Path, docrootPath: Path, props: CatalogProps): CatalogEntry {
		return new CatalogEntry({
			name: basePath.nameWithExtension,
			rootCaterogyRef: this._fp.getItemRef(docrootPath),
			basePath,
			props,
			load: (entry) => this._getCatalogByEntry(entry),
			isReadOnly: this._isReadOnly,
			fs: this,
		});
	}

	@trace({ level: Level.Internal })
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
		article?: { props: ArticleProps; content: string },
		catalog?: Catalog,
	): Promise<Category> {
		const shouldWriteIndex =
			!catalog?.props?.optionalCategoryIndex ||
			article?.content ||
			(article?.props && Object.values(article.props).filter(Boolean).length);

		shouldWriteIndex
			? await this._fp.write(path, article ? this.serialize(article) : "")
			: await this._fp.mkdir(path.parentDirectoryPath);

		return await this.makeCategory(path.parentDirectoryPath, parent, catalog, shouldWriteIndex ? path : null);
	}

	async createArticle(path: Path, parent: Category, initProps?: ArticleProps, catalog?: Catalog): Promise<Article> {
		const { props, content } = this.parseMarkdown(await this._fp.read(path));

		const stat = await this._fp.getStat(path);
		const article = await this.makeArticleByProps(path, initProps || props, content, parent, stat.mtimeMs, catalog);

		return article;
	}

	async moveArticle(article: Article, path: Path): Promise<void> {
		await this._fp.move(article.ref.path, path);
	}

	async moveCategory(category: Category, path: Path): Promise<void> {
		await this._fp.move(category.ref.path.parentDirectoryPath, path);
	}

	async saveCatalog(catalog: BaseCatalog): Promise<void> {
		const props = catalog.props;
		delete (props as { link?: unknown }).link;

		const propsToSave = { ...props };
		ExcludedProps.forEach((key) => delete propsToSave[key]);

		const text = this._serializeProps(propsToSave);
		await this._fp.write(catalog.getRootCategoryRef().path, text);
		catalog.repo?.resetCachedStatus();
	}

	@trace({ level: Level.Internal })
	async saveArticle(path: Path, content: string, props: ArticleProps): Promise<void> {
		const mutable = { content, props };
		await this.events.emit("item-serialize", { mutable });
		const text = this.serialize({ props: mutable.props, content: mutable.content });
		await this._fp.write(path, text);
	}

	async makeArticleByProps(
		path: Path,
		props: ArticleProps,
		content: string,
		parent: Category,
		lastModified: number,
		catalog?: Catalog,
	): Promise<Article> {
		const articleCodeInCategory = parent.folderPath.subDirectory(path).stripDotsAndExtension;
		const logicPath = Path.join(parent.logicPath, articleCodeInCategory);

		return await this._createArticleByProps(props ?? {}, parent, path, logicPath, content, lastModified, catalog);
	}

	async makeCategory(path: Path, parent: Category, catalog: Catalog, indexPath?: Path): Promise<Category> {
		const parsed = indexPath ? this.parseMarkdown(await this._fp.read(indexPath)) : { props: {}, content: "" };

		const mutable = { props: parsed.props, content: parsed.content };
		await this.events.emit("item-read", { catalog, mutable });

		return await this._makeCategoryByProps(mutable.props, path, mutable.content, parent, catalog, indexPath);
	}

	parseMarkdown(content: string): MarkdownProps {
		let md: matter.GrayMatterFile<string>;
		try {
			md = matter(content, {});
			if (md.data && typeof md.data !== "object") throw "Wrong format";
		} catch (e) {
			console.error("Invalid matter in markdown", content, e);
			return { props: {}, content: "" };
		}
		return { props: md.data as ArticleProps, content: md.content.trim() };
	}

	serialize(props: MarkdownProps): string {
		return `---\n${this._serializeProps(props.props)}---\n\n${props.content}`;
	}

	/**
	 * A branch merge/sync can leave both `foo.md` (article) and `foo/_index.md` (category) in one
	 * parent directory — same logical name, duplicate logicPath, ambiguous links. Healing is only
	 * legal on a writable on-disk catalog: never for a read-only file structure, a git-tree
	 * (revision) provider, or static/cli environments.
	 */
	private _canHealCollisions(catalogBasePath: Path): boolean {
		if (this._isReadOnly) return false;
		const env = getExecutingEnvironment();
		if (env === "static" || env === "cli") return false;
		const fp = this._fp.at(catalogBasePath);
		return fp.kind !== "git" && !fp.isReadOnly;
	}

	/**
	 * Heals one article/category name collision (`foo.md` next to `foo/_index.md`). If the category
	 * index has no own body, the article (frontmatter + content) is folded into `foo/_index.md` and
	 * `foo.md` is deleted; otherwise the category wins the name and the article is renamed to a
	 * unique sibling name. The resulting path movement is recorded so link repointing can run once
	 * the catalog is fully hydrated (see the `catalog-collision-healed` event). Mutates disk;
	 * callers must check `_canHealCollisions` first.
	 */
	private async _healArticleCategoryCollision(
		articlePath: Path,
		categoryIndexPath: Path,
		catalog: Catalog,
	): Promise<{ action: "fold" } | { action: "rename"; newArticlePath: Path }> {
		if (await this._categoryIndexHasNoContent(categoryIndexPath)) {
			// Fold the article's body into the section index, but keep the section's own frontmatter
			// (`order`/`title` on `foo/_index.md` may legitimately diverge from `foo.md` after a
			// merge/sync). The article's props only fill keys the section doesn't set, so structural
			// data on the section side is never silently overwritten.
			const article = this.parseMarkdown(await this._fp.read(articlePath));
			const index = this.parseMarkdown(await this._fp.read(categoryIndexPath));
			const merged = { props: { ...article.props, ...index.props }, content: article.content };
			await this._fp.write(categoryIndexPath, this.serialize(merged));
			await this._fp.delete(articlePath);
			this._pushCollisionMovement(catalog, { oldPath: articlePath, newPath: categoryIndexPath });
			addEvent("collision-fold", Level.Internal, { article: articlePath.value, index: categoryIndexPath.value });
			return { action: "fold" };
		}

		const parentDir = articlePath.parentDirectoryPath;
		const siblings = (await this._fp.readdir(parentDir)).map((name) => name.replace(/\.md$/, ""));
		const newName = uniqueName(articlePath.name, siblings);
		const newArticlePath = parentDir.join(new Path(`${newName}.md`));
		await this._fp.move(articlePath, newArticlePath);
		this._pushCollisionMovement(catalog, { oldPath: articlePath, newPath: newArticlePath });
		addEvent("collision-rename", Level.Internal, { article: articlePath.value, renamed: newArticlePath.value });
		return { action: "rename", newArticlePath };
	}

	/** No own content = missing index or a body that is empty/whitespace (frontmatter-only counts as empty). */
	private async _categoryIndexHasNoContent(indexPath: Path): Promise<boolean> {
		if (!(await this._fp.exists(indexPath))) return true;
		const raw = await this._fp.read(indexPath);
		try {
			return !matter(raw ?? "", {}).content.trim();
		} catch {
			// unparsable frontmatter — never treat as empty, a fold would destroy it
			return false;
		}
	}

	private _pushCollisionMovement(catalog: Catalog, movement: CollisionMovement): void {
		const movements = this._collisionMovements.get(catalog);
		if (movements) movements.push(movement);
		else this._collisionMovements.set(catalog, [movement]);
	}

	private async _emitCollisionHealed(catalog: Catalog): Promise<void> {
		const movements = this._collisionMovements.get(catalog);
		if (!movements?.length) return;
		this._collisionMovements.delete(catalog);
		await this._events.emit("catalog-collision-healed", { fs: this, catalog, movements });
	}

	private async _getCatalogByEntry(entry: CatalogEntry): Promise<Catalog> {
		assert(entry, "cannot resolve catalog from entry; entry is undefined");

		const env = getExecutingEnvironment();
		const useNative = feature("native-fs") && env !== "static" && env !== "cli";
		const docrootRel = entry.props.docrootIsNoneExistent
			? null
			: (entry.basePath.subDirectory(entry.getRootCategoryRef().path)?.value ?? null);
		const tree = useNative
			? await this._tryNativeScanCatalogByPath(entry.basePath, {
					docrootRel,
					optionalCategoryIndex: !!entry.props.optionalCategoryIndex,
				})
			: null;
		if (tree) {
			addEvent("used-method", Level.Internal, { method: "native", scope: "catalog" });
			return this._hydrateCatalogFromTree(entry, tree);
		}

		addEvent("used-method", Level.Internal, { method: "js", scope: "catalog" });

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
			fp: this._fp.at(entry.basePath) as FileProvider,
			isReadOnly: this._isReadOnly,
		});

		const mutableItem = { item: category };
		this.events.emitSync("before-item-create", { catalog, mutableItem });

		await this._readCategoryItems(entry.getRootCategoryDirectoryPath(), category, catalog);

		catalog.bindItemEvents();

		this._bindCatalogEvents(catalog);

		await this._emitCollisionHealed(catalog);

		await this.events.emit("catalog-read", { fs: this, catalog });

		return catalog;
	}

	private _bindCatalogEvents(catalog: Catalog) {
		catalog.events.on("item-moved", (args) => this.events.emit("item-moved", args));
		catalog.events.on("item-created", (args) => this.events.emit("item-created", args));
		catalog.events.on("item-deleted", (args) => this.events.emit("item-deleted", args));
		catalog.events.on("item-props-updated", (args) => this.events.emit("item-props-updated", args));
		catalog.events.on("item-order-updated", (args) => this.events.emit("item-order-updated", args));
	}

	@trace({ level: Level.Internal, omitArgs: true, omitResult: true })
	private async _tryNativeScanCatalogByPath(
		path: Path,
		opts?: { docrootRel?: string | null; optionalCategoryIndex?: boolean },
	): Promise<CatalogTreeDto | null> {
		try {
			const fp = this._fp.at(path);
			// For git-mounted catalogs (bare repos) the gitfp builds the proper `FsScope::Git`
			// (repo + tree read scope) and a tree-relative path — Rust's GitFs reads straight
			// from the git tree. Disk providers just scan from the workspace-relative path.
			const { scope, scopedPath } =
				fp.kind === "git"
					? (fp as unknown as GitTreeFileProvider).getNativeScope(path)
					: { scope: { kind: "disk" as const, root: fp.rootPath.value }, scopedPath: path.value };
			const tree = await rustCall<CatalogTreeDto>("fs.scan_catalog", {
				scope,
				path: scopedPath,
				docrootRel: opts?.docrootRel ?? null,
				opts: {
					excludeDirs: FS_EXCLUDE_FILENAMES,
					categoryIndexFilename: CATEGORY_ROOT_FILENAMES,
					docrootFilenames: DOC_ROOT_FILENAMES,
					workspaceConfigFilename: WORKSPACE_CONFIG_FILENAME,
					docrootSearchDepth: 5,
					optionalCategoryIndex: opts?.optionalCategoryIndex ?? true,
					maxConcurrency: 5,
					followSymlinks: false,
					knownWorkspacePaths: this._knownWorkspacePaths,
				},
			});
			return tree;
		} catch (e) {
			addEvent("native-scan-catalog-failed", Level.Internal, { error: String(e) });
			return null;
		}
	}

	private _makeEntryFromTree(basePath: Path, tree: CatalogTreeDto, initProps: CatalogProps): CatalogEntry {
		const docrootPath = basePath.join(new Path(tree.docrootRel ?? DOC_ROOT_FILENAME));
		const props: CatalogProps = tree.docrootRel ? tree.catalogProps : this._defaultProps(basePath);
		return this._makeCatalogEntry(basePath, docrootPath, { ...initProps, ...props });
	}

	@trace({ level: Level.Internal, omitArgs: true, omitResult: true })
	private async _hydrateCatalogFromTree(entry: CatalogEntry, tree: CatalogTreeDto): Promise<Catalog> {
		const rootCategory = new Category({
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
			root: rootCategory,
			rootCaterogyRef: rootCategory.ref,
			basePath: entry.basePath,
			fs: this,
			fp: this._fp.at(entry.basePath) as FileProvider,
			isReadOnly: this._isReadOnly,
		});

		const rootMutable = { item: rootCategory };
		this.events.emitSync("before-item-create", { catalog, mutableItem: rootMutable });

		await this._hydrateChildren(tree.children, rootCategory, catalog, entry.basePath);

		catalog.bindItemEvents();
		this._bindCatalogEvents(catalog);

		await this._emitCollisionHealed(catalog);

		await this.events.emit("catalog-read", { fs: this, catalog });

		return catalog;
	}

	private async _hydrateChildren(
		children: NodeDto[],
		parent: Category,
		catalog: Catalog,
		basePath: Path,
	): Promise<void> {
		const resolvedChildren = await this._healCollisionsNative(children, catalog, basePath);
		for (const child of resolvedChildren) {
			if (child.kind === "article") {
				const article = await this._hydrateArticle(child, parent, catalog, basePath);
				if (!article) continue;

				const passFilter = await this._events.emit("item-filter", {
					fs: this,
					catalogProps: catalog.props,
					parent,
					item: article,
				});
				if (passFilter) parent.items.push(article);
				continue;
			}

			if (!child.hasIndex && !catalog.props.optionalCategoryIndex) {
				await this._hydrateChildren(child.children, parent, catalog, basePath);
				continue;
			}

			const category = await this._hydrateCategory(child, parent, catalog, basePath);
			if (!category) continue;

			const passFilter = await this._events.emit("item-filter", {
				fs: this,
				catalogProps: catalog.props,
				parent,
				item: category,
			});
			if (!passFilter) continue;

			const passCategoryFilter = await this._events.emit("category-filter", {
				fs: this,
				catalogProps: catalog.props,
				parent,
				item: category,
			});

			if (passCategoryFilter) {
				parent.items.push(category);
				continue;
			}

			const orders = parent.items.map((i) => i.order);
			category.items.reduce((prev, item) => {
				item.props.order = roundedOrderAfter(orders, prev);
				return item.props.order;
			}, category.order);
			parent.items.push(...category.items);
		}

		await parent.sortItems("no-sort");
	}

	/** Resolves article/category name collisions among sibling nodes of the native scan tree. */
	private async _healCollisionsNative(children: NodeDto[], catalog: Catalog, basePath: Path): Promise<NodeDto[]> {
		const categories = new Map<string, CategoryNodeDto>();
		for (const child of children) {
			if (child.kind === "category" && child.hasIndex) categories.set(new Path(child.directory).name, child);
		}
		if (!categories.size) return children;

		const out: NodeDto[] = [];
		for (const child of children) {
			if (child.kind !== "article") {
				out.push(child);
				continue;
			}

			const relPath = new Path(child.relPath);
			const categoryNode = categories.get(relPath.name);
			if (!categoryNode || !this._canHealCollisions(catalog.basePath)) {
				out.push(child);
				continue;
			}

			const indexPath = basePath.join(new Path(categoryNode.relPath));
			const healed = await this._healArticleCategoryCollision(basePath.join(relPath), indexPath, catalog);
			if (healed.action === "fold") {
				categoryNode.frontMatter = this.parseMarkdown(await this._fp.read(indexPath)).props;
				continue;
			}

			child.relPath = relPath.parentDirectoryPath.join(new Path(healed.newArticlePath.nameWithExtension)).value;
			out.push(child);
		}
		return out;
	}

	private async _hydrateArticle(
		node: ArticleNodeDto,
		parent: Category,
		catalog: Catalog,
		basePath: Path,
	): Promise<Article | null> {
		const absPath = basePath.join(new Path(node.relPath));
		const articleCodeInCategory = parent.folderPath.subDirectory(absPath).name;
		const logicPath = Path.join(parent.logicPath, articleCodeInCategory);

		const mutable = { content: "", props: node.frontMatter as ArticleProps };
		await this.events.emit("item-read", { catalog, mutable });

		const article = new Article({
			ref: this._fp.getItemRef(absPath),
			parent,
			fs: this,
			lastModified: 0,
			content: null,
			props: mutable.props,
			logicPath,
		});

		const mutableItem = { item: article };
		this.events.emitSync("before-item-create", { catalog, mutableItem });

		return mutableItem.item as Article;
	}

	private async _hydrateCategory(
		node: CategoryNodeDto,
		parent: Category,
		catalog: Catalog,
		basePath: Path,
	): Promise<Category | null> {
		const indexPath = node.hasIndex ? basePath.join(new Path(node.relPath)) : null;
		const folderPath = basePath.join(new Path(node.directory));
		const logicPath = Path.join(
			parent.logicPath,
			indexPath
				? parent.ref.path.parentDirectoryPath.subDirectory(indexPath.parentDirectoryPath).value
				: folderPath.name,
		);

		const mutable = { content: "", props: node.frontMatter as CategoryProps };
		await this.events.emit("item-read", { catalog, mutable });

		const category = new Category({
			ref: this._fp.getItemRef(indexPath ?? folderPath.join(new Path(CATEGORY_ROOT_FILENAME))),
			parent,
			content: null,
			props: mutable.props,
			logicPath,
			directory: folderPath,
			items: [],
			lastModified: 0,
			fs: this,
		});

		await this._hydrateChildren(node.children, category, catalog, basePath);

		const mutableItem = { item: category };
		this.events.emitSync("before-item-create", { catalog, mutableItem });

		if (!node.hasIndex) category.props.shouldBeCreated = true;

		return mutableItem.item as Category;
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

		const mutableItem = { item: category };
		this.events.emitSync("before-item-create", { catalog, mutableItem });

		return mutableItem.item;
	}

	/**
	 * @deprecated Replaced by native `_hydrateCatalogFromTree` under `feature("native-fs")`.
	 */
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

		if (!passFilter) return;

		const passCategoryFilter = await this.events.emit("category-filter", {
			fs: this,
			catalogProps: catalog.props,
			parent: parentCategory,
			item: category,
		});

		if (passCategoryFilter) {
			parentCategory.items.push(category);
			return;
		}

		const orders = parentCategory.items.map((i) => i.order);

		category.items.reduce((prev, item) => {
			item.props.order = roundedOrderAfter(orders, prev);
			return item.props.order;
		}, category.order);

		parentCategory.items.push(...category.items);
	}

	/**
	 * @deprecated Replaced by native `_hydrateCategoryChildren` under `feature("native-fs")`.
	 */
	private async _readCategoryItems(folderPath: Path, category: Category, catalog: Catalog) {
		const files = await this._fp.getItems(folderPath);

		const mdFiles = files.filter((f) => {
			return !f.isDirectory() && f.name.match(/\.md$/) && !FileStructure.isCategory(f.name);
		});

		const directories = files.filter((f) => f.isDirectory() && !FS_EXCLUDE_FILENAMES.includes(f.name));

		const articlePaths = await this._healCollisionsJs(mdFiles, directories, folderPath, catalog);

		const articles = await articlePaths.mapAsync(async (articlePath) => {
			const article = await this._makeArticle(articlePath, category, catalog);
			if (!article) return null;

			const filter = await this.events.emit("item-filter", {
				fs: this,
				catalogProps: catalog.props,
				parent: category,
				item: article,
			});

			return filter ? article : null;
		}, 10);

		category.items.push(...articles.filter((article) => article !== null));

		for (const f of directories) await this._readCategory(f.path, category, catalog);
		await category.sortItems("no-sort");
	}

	/** Resolves article/category name collisions inside one directory; returns article paths to hydrate. */
	private async _healCollisionsJs(
		mdFiles: FileInfo[],
		directories: FileInfo[],
		folderPath: Path,
		catalog: Catalog,
	): Promise<Path[]> {
		const dirNames = new Set(directories.map((d) => d.name));
		const out: Path[] = [];
		for (const f of mdFiles) {
			const stem = f.name.replace(/\.md$/, "");
			if (!dirNames.has(stem)) {
				out.push(f.path);
				continue;
			}

			const indexPath = folderPath.join(new Path([stem, CATEGORY_ROOT_FILENAME]));
			if (!(await this._fp.exists(indexPath)) || !this._canHealCollisions(catalog.basePath)) {
				out.push(f.path);
				continue;
			}

			const healed = await this._healArticleCategoryCollision(f.path, indexPath, catalog);
			if (healed.action === "rename") out.push(healed.newArticlePath);
		}
		return out;
	}

	/**
	 * @deprecated Replaced by native `_hydrateArticle` under `feature("native-fs")`.
	 */
	private async _makeArticle(path: Path, parentCategory: Category, catalog: Catalog): Promise<Article> {
		const { props, content } = this.parseMarkdown(await this._fp.read(path));
		const articleCodeInCategory = parentCategory.folderPath.subDirectory(path).name;

		const logicPath = Path.join(parentCategory.logicPath, articleCodeInCategory);
		const stat = await this._fp.getStat(path);

		const mutable = { content, props };
		await this.events.emit("item-read", { catalog, mutable });

		const article = this._createArticleByProps(
			mutable.props,
			parentCategory,
			path,
			logicPath,
			mutable.content,
			stat.mtimeMs,
			catalog,
		);

		return article;
	}

	private async _createArticleByProps(
		props: ArticleProps,
		parent: Category,
		path: Path,
		logicPath: string,
		content: string,
		lastModified?: number,
		catalog?: Catalog,
	): Promise<Article> {
		const mutable = { content, props };
		await this.events.emit("item-read", { catalog, mutable });

		const initProps = {
			ref: this._fp.getItemRef(path),
			parent,
			fs: this,
			lastModified: lastModified || 0,
			content: mutable.content,
			logicPath,
		};

		const mutableItem = { item: new Article({ ...initProps, props: mutable.props }) };
		this.events.emitSync("before-item-create", { catalog, mutableItem });

		return mutableItem.item;
	}

	@trace({ level: Level.Internal })
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
				return;
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
		let props: object;
		try {
			props = (yaml.load(await this._fp.read(path)) as object) ?? {};
			if (typeof props !== "object") throw "Wrong format";
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

	private _serializeProps(props: FSProps): string {
		const p = Object.fromEntries(Object.entries(props).filter(([, v]) => !!v));
		delete p.welcome;
		if (p.lang === resolveLanguage()) delete p.lang;
		// Keep frontmatter keys in a stable, conventional order regardless of how props were
		// mutated. setOrder/setOrderAfter/setLastPosition assign `order` as a brand-new key on
		// items that had none yet, which JS appends last; without normalization a save would
		// leave `order` at the bottom (or, hoisted alone, push `title` off the top). Emit the
		// lead keys as `title`, `description`, `order`, then everything else in insertion order
		// (see FileStructure.unit.test.ts). Positional only — parsing is order-independent.
		const LEAD_KEYS = ["title", "description", "order"];
		const normalized = Object.fromEntries([
			...LEAD_KEYS.filter((k) => k in p).map((k) => [k, p[k]]),
			...Object.entries(p).filter(([k]) => !LEAD_KEYS.includes(k)),
		]);
		return yaml.dump(normalized, { quotingType: '"' });
	}
}
