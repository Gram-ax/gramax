import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type ArticleParser from "@core/FileStructue/Article/ArticleParser";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type FileStructure from "@core/FileStructue/FileStructure";
import type SitePresenter from "@core/SitePresenter/SitePresenter";
import schedulerYield from "@core-ui/utils/schedulerYield";
import type {
	DiffCompareOptions,
	DiffTree2TreeFile,
	DiffTree2TreeInfo,
} from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitDiffItemCreator from "@ext/git/core/GitDiffItemCreator/GitDiffItemCreator";
import type { DiffItem, DiffResource } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

type PathAssignees = Map<string, { article: Article; catalog: ReadonlyCatalog }>;
type ArticleWithCatalog = { article: Article; catalog: ReadonlyCatalog };

export default class RevisionDiffItemCreator extends GitDiffItemCreator {
	private _fp: FileProvider;

	constructor(
		catalog: ReadonlyCatalog,
		sp: SitePresenter,
		fs: FileStructure,
		private _articleParser: ArticleParser,
		private _compareOptions: DiffCompareOptions,
		private _oldCatalog: ReadonlyCatalog,
		private _newCatalog: ReadonlyCatalog,
	) {
		super(catalog, sp, fs);
		this._fp = fs.fp;
	}

	protected async _assignResourcesToItems(
		resources: DiffTree2TreeFile[],
		diffItems: DiffItem[],
	): Promise<DiffResource[]> {
		const unassigneedResources = new Set<DiffResource>();
		const allResources = new Set<DiffResource>();
		const resourcePathAssignees: PathAssignees = new Map();

		const isAnyResourceDeletedOrRenamed = resources.some(
			(c) => c.status === FileStatus.delete || c.status === FileStatus.rename,
		);

		const articlesWithCatalogs = await this._getDiffArticles(isAnyResourceDeletedOrRenamed, diffItems);

		const { itemsByLogicPath, resourcePathSetByItem } = this._buildDiffItemsIndex(diffItems);

		const resourceUsageIndex = await this._buildResourceUsageIndex(articlesWithCatalogs);

		const pathnameCache = new Map<Article, string>();
		const getPathnameCached = async (catalog: ReadonlyCatalog, article: Article) => {
			const cached = pathnameCache.get(article);
			if (cached) return cached;
			const v = await catalog.getPathname(article);
			pathnameCache.set(article, v);
			return v;
		};

		for (let i = 0; i < resources.length; i++) {
			const resource = resources[i];
			let isResourceAssigned = false;

			const assignees = resourceUsageIndex.get(resource.path.value);

			if (assignees && assignees.length > 0) {
				for (const { article, catalog } of assignees) {
					resourcePathAssignees.set(resource.path.value, { article, catalog });

					const parentPath = catalog.getRepositoryRelativePath(article.ref).value;

					const diffResource = this._getDiffResource(resource, {
						path: parentPath,
						oldPath: parentPath,
					});

					allResources.add(diffResource);

					const logicPath = await getPathnameCached(catalog, article);

					const candidates = itemsByLogicPath.get(logicPath) ?? [];

					for (const diffItem of candidates) {
						const set = resourcePathSetByItem.get(diffItem)!;

						if (!set.has(diffResource.filePath.path)) {
							diffItem.resources.push(diffResource);
							set.add(diffResource.filePath.path);
							isResourceAssigned = true;
						}
					}

					if (!isResourceAssigned && resource.status !== FileStatus.delete) {
						isResourceAssigned = true;

						const item = await this._getNewOrModifiedDiffItemByArticle(
							this._getDiffFileByArticle(article, catalog),
							article,
							catalog,
							false,
							[diffResource],
						);

						diffItems.push(item);

						const set = new Set<string>([diffResource.filePath.path]);
						resourcePathSetByItem.set(item, set);

						const list = itemsByLogicPath.get(item.logicPath);
						if (list) list.push(item);
						else itemsByLogicPath.set(item.logicPath, [item]);
					}
				}
			}

			if (resource.status === FileStatus.rename) {
				const oldAssignees = resourceUsageIndex.get(resource.oldPath.value);
				if (oldAssignees && oldAssignees.length > 0) {
					const { article, catalog } = oldAssignees[0];
					resourcePathAssignees.set(resource.oldPath.value, { article, catalog });
				}
			}

			if (!isResourceAssigned) {
				const unassigneedResource = this._getDiffResource(resource, { path: null, oldPath: null });
				const isAssigned = await this._assignUnassigneedComment(unassigneedResource, diffItems);
				if (!isAssigned) {
					unassigneedResources.add(unassigneedResource);
					allResources.add(unassigneedResource);
				}
			}

			if ((i + 1) % 5 === 0) await schedulerYield();
		}

		this._addOldParentPathToDiffResource(allResources, resourcePathAssignees);

		return Array.from(unassigneedResources);
	}

	private _buildDiffItemsIndex(diffItems: DiffItem[]) {
		const itemsByLogicPath = new Map<string, DiffItem[]>();
		const resourcePathSetByItem = new Map<DiffItem, Set<string>>();

		for (const item of diffItems) {
			const list = itemsByLogicPath.get(item.logicPath);
			if (list) list.push(item);
			else itemsByLogicPath.set(item.logicPath, [item]);

			const set = new Set<string>();
			for (const r of item.resources) set.add(r.filePath.path);
			resourcePathSetByItem.set(item, set);
		}

		return { itemsByLogicPath, resourcePathSetByItem };
	}

	private async _buildResourceUsageIndex(
		articlesWithCatalogs: ArticleWithCatalog[],
	): Promise<Map<string, ArticleWithCatalog[]>> {
		const resourceUsageIndex = new Map<string, ArticleWithCatalog[]>();

		for (const { article, catalog } of articlesWithCatalogs) {
			const parsedContent = await article.parsedContent.read((p) => {
				if (!p) return null;
				return {
					paths: [
						...p.parsedContext.getResourceManager().resources,
						...p.parsedContext.getLinkManager().resources,
					],
					resourceManager: p.parsedContext.getResourceManager(),
				};
			});

			if (!parsedContent) continue;

			const { paths, resourceManager } = parsedContent;
			const rootCategoryPath = catalog.basePath;

			for (const path of paths) {
				const absoluteResourcePath = resourceManager.getAbsolutePath(path);
				const itemResourcePath = rootCategoryPath.subDirectory(absoluteResourcePath) || absoluteResourcePath;

				const key = itemResourcePath.value;

				const arr = resourceUsageIndex.get(key);
				if (arr) arr.push({ article, catalog });
				else resourceUsageIndex.set(key, [{ article, catalog }]);
			}
		}

		return resourceUsageIndex;
	}

	private async _assignUnassigneedComment(
		unassigneedResource: DiffResource,
		diffItems: DiffItem[],
	): Promise<boolean> {
		const isDeleted = unassigneedResource.status === FileStatus.delete;
		if (isDeleted) return false;
		const isComment = unassigneedResource.filePath.path.endsWith(".comments.yaml");
		if (!isComment) return false;

		const probablyArticleName = new Path(unassigneedResource.filePath.path).nameWithExtension.replace(
			".comments.yaml",
			".md",
		);
		const probablyArticlePath = unassigneedResource.filePath.path.replace(".comments.yaml", ".md");

		const itemRefPath = this._newCatalog.getItemRefPath(new Path(unassigneedResource.filePath.path));
		const directoryPath = itemRefPath.parentDirectoryPath;

		const dir = await this._fp.readdir(directoryPath);
		if (!dir.includes(probablyArticleName)) return false;

		const article = await this._getArticleByRepPath(this._newCatalog, probablyArticlePath);
		if (!article) return false;

		const parsedContent = await article.parsedContent.read((p) => {
			if (!p) return null;
			return {
				paths: [
					...p.parsedContext.getResourceManager().resources,
					...p.parsedContext.getLinkManager().resources,
				],
				resourceManager: p.parsedContext.getResourceManager(),
			};
		});

		if (!parsedContent) return false;

		const { paths, resourceManager } = parsedContent;

		const isResourceExistsInArticle = paths.some((path) =>
			resourceManager.getAbsolutePath(path).endsWith(new Path(unassigneedResource.filePath.path)),
		);
		if (!isResourceExistsInArticle) return false;

		const diffItem = await this._getNewOrModifiedDiffItemByArticle(
			{
				added: 0,
				deleted: 0,
				path: new Path(probablyArticlePath),
				oldPath: new Path(probablyArticlePath),
				status: FileStatus.modified,
				isLfs: false,
				size: 0,
			},
			article,
			this._newCatalog,
			true,
			[unassigneedResource],
		);
		diffItems.push(diffItem);
		return true;
	}

	private _addOldParentPathToDiffResource(allResources: Set<DiffResource>, resourcePathAssignees: PathAssignees) {
		allResources.forEach((diffResource) => {
			if (diffResource.status !== FileStatus.rename) return;
			const oldPath = diffResource.filePath.oldPath;
			if (!resourcePathAssignees.has(oldPath)) return;
			const { article, catalog } = resourcePathAssignees.get(oldPath);
			diffResource.parentPath.oldPath = catalog.getRepositoryRelativePath(article.ref).value;
		});
	}

	protected async _getOldDiffItem(file: DiffTree2TreeFile): Promise<DiffItem> {
		if (!this._isMarkdown(file.path)) return null;

		const diffItem = await super._getOldDiffItem(file);
		const itemRef = this._fp.getItemRef(this._oldCatalog.getItemRefPath(file.path));
		const oldArticle = this._oldCatalog.findItemByItemRef<Article>(itemRef);
		if (!oldArticle) return null;
		const logicPath = await this._oldCatalog.getPathname(oldArticle);

		diffItem.logicPath = logicPath;
		diffItem.title = oldArticle.getTitle();

		return diffItem;
	}

	protected async _getNewOrModifiedDiffItem(file: DiffTree2TreeFile): Promise<DiffItem> {
		if (!this._isMarkdown(file.path)) return null;

		const newArticleItemRef = this._fp.getItemRef(this._newCatalog.getItemRefPath(file.path));
		const newArticle = this._newCatalog.findItemByItemRef<Article>(newArticleItemRef);
		if (!newArticle) return null;

		return this._getNewOrModifiedDiffItemByArticle(file, newArticle, this._newCatalog, true, []);
	}

	protected async _getDiffFiles(): Promise<DiffTree2TreeInfo> {
		return this._gitVersionControl.diff({
			compare: { ...this._compareOptions },
			renames: true,
		});
	}

	private async _getNewOrModifiedDiffItemByArticle(
		file: DiffTree2TreeFile,
		article: Article,
		catalog: ReadonlyCatalog,
		isChanged: boolean,
		resources: DiffResource[] = [],
	): Promise<DiffItem> {
		return {
			type: "item",
			status: file.status,
			title: article.getTitle(),
			order: article.props.order,
			filePath: this._getFilePath(file),
			logicPath: await catalog.getPathname(article),
			resources,
			isChanged,
			added: file?.added,
			deleted: file?.deleted,
			isLfs: file.isLfs,
			size: file.size,
		};
	}

	private _getDiffFileByArticle(article: Article, catalog: ReadonlyCatalog): DiffTree2TreeFile {
		return {
			path: catalog.getRepositoryRelativePath(article.ref),
			oldPath: catalog.getRepositoryRelativePath(article.ref),
			status: FileStatus.modified,
			added: 0,
			deleted: 0,
			isLfs: false,
			size: 0,
		};
	}

	private async _getDiffArticles(
		isAnyResourceDeletedOrRenamed: boolean,
		diffItems: DiffItem[],
	): Promise<ArticleWithCatalog[]> {
		const articles: ArticleWithCatalog[] = [];

		await diffItems.forEachAsync(async (item) => {
			const newArticle = await this._getArticleByRepPath(this._newCatalog, item.filePath.path);
			if (newArticle) articles.push({ article: newArticle, catalog: this._newCatalog });

			if (isAnyResourceDeletedOrRenamed) {
				const oldArticle = await this._getArticleByRepPath(this._oldCatalog, item.filePath.oldPath);
				if (oldArticle) articles.push({ article: oldArticle, catalog: this._oldCatalog });
			}
		});

		return articles;
	}

	private async _getArticleByRepPath(catalog: ReadonlyCatalog, path: string): Promise<Article> {
		const itemRefPath = catalog.getItemRefPath(new Path(path));
		const itemRef = this._fp.getItemRef(itemRefPath);
		const article = catalog.findItemByItemRef<Article>(itemRef);
		try {
			await this._articleParser.parse(article, catalog);
		} catch {
			return null;
		}
		return article;
	}
}
