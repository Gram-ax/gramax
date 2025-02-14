import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import FileStructure from "@core/FileStructue/FileStructure";
import { MarkdownExtension } from "@core/FileStructue/Item/ItemExtensions";
import ResourceExtensions from "@core/Resource/ResourceExtensions";
import SitePresenter from "@core/SitePresenter/SitePresenter";
import { DiffTree2TreeFile, DiffTree2TreeInfo } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitDiffItemAliasApplier from "@ext/git/core/GitDiffItemCreator/GitDiffItemAliasApplier";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import { getDiff } from "@ext/VersionControl/DiffHandler/DiffHandler";
import type { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";
import type { DiffFilePaths, DiffItem, DiffItemResourceCollection, DiffResource } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

export default abstract class GitDiffItemCreator {
	protected _gitVersionControl: GitVersionControl;
	protected _fp: FileProvider;

	private _cachedNewFiles: Map<string, { content: string; status: FileStatus }> = new Map();
	private _cachedOldFiles: Map<string, { content: string; status: FileStatus }> = new Map();

	constructor(protected _catalog: ReadonlyCatalog, protected _sp: SitePresenter, protected _fs: FileStructure) {
		this._gitVersionControl = this._catalog.repo.gvc;
		this._fp = _fs.fp;
	}

	public async getDiffItems(): Promise<DiffItemResourceCollection> {
		this._cachedNewFiles.clear();
		this._cachedOldFiles.clear();

		if (!this._gitVersionControl) return { items: [], resources: [] };
		const files = await this._getChangedFiles();
		const { items, resources } = await this._resolveDiffItems(files.items, files.resources);

		if (resources.length === 0) {
			GitDiffItemAliasApplier.apply(items);
			return { items, resources: [] };
		}

		const remainingResources = await this._assignResourcesToItems(resources, items);

		GitDiffItemAliasApplier.apply(items);
		GitDiffItemAliasApplier.apply(remainingResources);

		return { items, resources: remainingResources };
	}

	private async _resolveDiffItems(
		files: DiffTree2TreeFile[],
		resources: DiffTree2TreeFile[],
	): Promise<{ items: DiffItem[]; resources: DiffTree2TreeFile[] }> {
		const diffItems: DiffItem[] = [];

		for (const file of files) {
			if (file.status === FileStatus.delete) {
				const oldDiffItem = await this._getOldDiffItem(file);
				diffItems.push(oldDiffItem);
				continue;
			}

			const diffItem = await this._getNewOrModifiedDiffItem(file);

			if (!diffItem) {
				resources.push(file);
				continue;
			}

			diffItems.push(diffItem);
		}
		return { items: diffItems.filter(Boolean), resources };
	}

	protected async _getDiffResource(file: DiffTree2TreeFile, parentPath: DiffFilePaths): Promise<DiffResource> {
		const isImage = ResourceExtensions.images.includes(file.path.extension);
		let content = "";
		let oldContent = "";
		if (!isImage) {
			content =
				file.status === FileStatus.delete
					? await this._getOldContentCached(file)
					: await this._getNewContentCached(file);
			if (file.status !== FileStatus.new) oldContent = await this._getOldContentCached(file);
		}
		return {
			parentPath,
			status: file.status,
			type: "resource",
			isChanged: true,
			filePath: this._getFilePath(file),
			title: file.path.nameWithExtension,
			added: file.added,
			deleted: file.deleted,
			content,
			oldContent,
			hunks: isImage ? null : await this._getDiffHunksByFile(file),
		};
	}

	protected async _getDiffHunksByFile(file: DiffTree2TreeFile): Promise<DiffHunk[]> {
		const oldContent = await this._getOldContentCached(file);
		const newContent = await this._getNewContentCached(file);
		return getDiff(oldContent, newContent).changes;
	}

	protected async _getOldDiffItem(file: DiffTree2TreeFile): Promise<DiffItem> {
		const oldContent = await this._getOldContentCached(file);

		return {
			type: "item",
			status: FileStatus.delete,
			order: Number.MAX_SAFE_INTEGER,
			title: this._fs.parseMarkdown(oldContent).props.title,
			filePath: { path: file.path.value },
			content: oldContent,
			hunks: await this._getDiffHunksByFile(file),
			resources: [],
			isChanged: true,
			added: file.added,
			deleted: file.deleted,
		};
	}

	protected async _getChangedFiles(): Promise<{
		items: DiffTree2TreeFile[];
		resources: DiffTree2TreeFile[];
	}> {
		const items: DiffTree2TreeFile[] = [];
		const resources: DiffTree2TreeFile[] = [];

		const diff = await this._getDiffFiles();

		diff.files.forEach((c) => {
			if (
				c.path.allExtensions?.length &&
				MarkdownExtension === (c.path.allExtensions[c.path.allExtensions.length - 1] ?? "")
			)
				return items.push(c);
			return resources.push(c);
		});

		return { items, resources };
	}

	protected async _getNewContentCached(file: DiffTree2TreeFile): Promise<string> {
		const cached = this._cachedNewFiles.get(file.path.value);
		if (cached && cached.status === file.status) return cached.content;

		if (file.status === FileStatus.delete) return "";

		try {
			const content = await this._getNewContent(file.path, file.status);
			this._cachedNewFiles.set(file.path.value, { content, status: file.status });
			return content;
		} catch {
			return "";
		}
	}

	protected async _getOldContentCached(file: DiffTree2TreeFile): Promise<string> {
		const cached = this._cachedOldFiles.get(file.oldPath.value);
		if (cached && cached.status === file.status) return cached.content;

		if (file.status === FileStatus.new) return "";

		try {
			const content = await this._getOldContent(file.oldPath, file.status);
			this._cachedOldFiles.set(file.oldPath.value, { content, status: file.status });
			return content;
		} catch {
			return "";
		}
	}

	protected _getFilePath(file: DiffTree2TreeFile): DiffFilePaths {
		if (!file) return null;
		if (file.oldPath.value === file.path.value || !file.oldPath.value)
			return { path: file.path.value, oldPath: file.oldPath.value, hunks: [] };

		return {
			path: file.path.value,
			oldPath: file.oldPath.value,
			hunks: getDiff(file.oldPath.value, file.path.value).changes,
		};
	}

	protected abstract _getDiffFiles(): Promise<DiffTree2TreeInfo>;
	protected abstract _getNewContent(path: Path, status: FileStatus): Promise<string>;
	protected abstract _getOldContent(path: Path, status: FileStatus): Promise<string>;
	protected abstract _assignResourcesToItems(res: DiffTree2TreeFile[], items: DiffItem[]): Promise<DiffResource[]>;
	protected abstract _getNewOrModifiedDiffItem(files: DiffTree2TreeFile): Promise<DiffItem>;
}
