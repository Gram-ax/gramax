import FileProvider from "@core/FileProvider/model/FileProvider";
import { Article } from "@core/FileStructue/Article/Article";
import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import FileStructure from "@core/FileStructue/FileStructure";
import SitePresenter from "@core/SitePresenter/SitePresenter";
import {
	DiffTree2TreeFile,
	DiffTree2TreeInfo,
	type DiffCompareOptions,
} from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitDiffItemCreator from "@ext/git/core/GitDiffItemCreator/GitDiffItemCreator";
import type { DiffItem, DiffResource } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

type PathAssignees = Map<string, { article: Article; catalog: ReadonlyCatalog }>;

export default class RevisionDiffItemCreator extends GitDiffItemCreator {
	private _fp: FileProvider;

	constructor(
		catalog: ReadonlyCatalog,
		sp: SitePresenter,
		fs: FileStructure,
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

		this._newCatalog = await this._sp.parseAllItems(this._newCatalog);

		const articles: { article: Article; catalog: ReadonlyCatalog }[] = this._newCatalog
			.getContentItems()
			.map((a) => ({ article: a, catalog: this._newCatalog }));

		const isAnyResourceDeletedOrRenamed = resources.some(
			(c) => c.status === FileStatus.delete || c.status === FileStatus.rename,
		);

		if (isAnyResourceDeletedOrRenamed) {
			this._oldCatalog = await this._sp.parseAllItems(this._oldCatalog);
			const items = this._oldCatalog.getContentItems().map((a) => ({ article: a, catalog: this._oldCatalog }));
			articles.push(...items);
		}

		for (const resource of resources) {
			let isResourceAssigned = false;
			let parentPath: string;

			for (const { article, catalog } of articles) {
				const parsedContent = await article.parsedContent.read((p) => {
					if (!p) return null;
					return {
						paths: [...p.resourceManager.resources, ...p.linkManager.resources],
						resourceManager: p.resourceManager,
					};
				});

				if (!parsedContent) continue;

				const { paths, resourceManager } = parsedContent;

				for (const path of paths) {
					if (resourceManager.getAbsolutePath(path).endsWith(resource.path)) {
						resourcePathAssignees.set(resource.path.value, { article, catalog });
						parentPath = catalog.getRepositoryRelativePath(article.ref).value;
						const diffResource = this._getDiffResource(resource, {
							path: parentPath,
							oldPath: parentPath,
						});
						allResources.add(diffResource);

						for (const diffItem of diffItems) {
							// If resource is deleted, it can only be attached to deleted article
							if (resource.status === FileStatus.delete && diffItem.status !== FileStatus.delete)
								continue;

							const diffItemResourcePaths = diffItem.resources.map((resource) => resource.filePath.path);

							const shouldAssign =
								!diffItemResourcePaths.includes(diffResource.filePath.path) &&
								diffItem.logicPath === (await catalog.getPathname(article));

							if (shouldAssign) {
								diffItem.resources.push(diffResource);
								isResourceAssigned = true;
							}
						}

						// If resource is deleted and not attached to any deleted article, then leave as resource
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
						}
					}
					if (
						resource.status === FileStatus.rename &&
						resourceManager.getAbsolutePath(path).endsWith(resource.oldPath)
					) {
						resourcePathAssignees.set(resource.oldPath.value, { article, catalog });
					}
				}
			}

			if (!isResourceAssigned) {
				const unassigneedResource = this._getDiffResource(resource, {
					path: parentPath,
					oldPath: parentPath,
				});
				unassigneedResources.add(unassigneedResource);
				allResources.add(unassigneedResource);
			}
		}

		this._addOldParentPathToDiffResource(allResources, resourcePathAssignees);

		return Array.from(unassigneedResources);
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
		};
	}

	private _getDiffFileByArticle(article: Article, catalog: ReadonlyCatalog): DiffTree2TreeFile {
		return {
			path: catalog.getRepositoryRelativePath(article.ref),
			oldPath: catalog.getRepositoryRelativePath(article.ref),
			status: FileStatus.modified,
			added: 0,
			deleted: 0,
		};
	}
}
