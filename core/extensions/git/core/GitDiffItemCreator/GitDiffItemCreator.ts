import Path from "@core/FileProvider/Path/Path";
import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import FileStructure from "@core/FileStructue/FileStructure";
import { MarkdownExtension } from "@core/FileStructue/Item/ItemExtensions";
import SitePresenter from "@core/SitePresenter/SitePresenter";
import { DiffTree2TreeFile, DiffTree2TreeInfo } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitDiffItemAliasApplier from "@ext/git/core/GitDiffItemCreator/GitDiffItemAliasApplier";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import { getDiff } from "@ext/VersionControl/DiffHandler/DiffHandler";
import type { DiffFilePaths, DiffItem, DiffItemResourceCollection, DiffResource } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

export default abstract class GitDiffItemCreator {
	protected _gitVersionControl: GitVersionControl;

	constructor(protected _catalog: ReadonlyCatalog, protected _sp: SitePresenter, protected _fs: FileStructure) {
		this._gitVersionControl = this._catalog.repo.gvc;
	}

	public async getDiffItems(): Promise<DiffItemResourceCollection> {
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
				if (!oldDiffItem) {
					resources.push(file);
					continue;
				}
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

	protected _getDiffResource(file: DiffTree2TreeFile, parentPath: DiffFilePaths): DiffResource {
		return {
			parentPath,
			status: file.status,
			type: "resource",
			isChanged: true,
			filePath: this._getFilePath(file),
			title: file.path.nameWithExtension,
			added: file.added,
			deleted: file.deleted,
		};
	}

	protected async _getOldDiffItem(file: DiffTree2TreeFile): Promise<DiffItem> {
		return Promise.resolve({
			type: "item",
			status: FileStatus.delete,
			order: Number.MAX_SAFE_INTEGER,
			title: file.path.nameWithExtension,
			filePath: { path: file.path.value },
			resources: [],
			isChanged: true,
			added: file.added,
			deleted: file.deleted,
		});
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

	protected _getFilePath(file: DiffTree2TreeFile): DiffFilePaths {
		if (!file) return null;
		if (file.oldPath.value === file.path.value || !file.oldPath.value)
			return { path: file.path.value, oldPath: file.oldPath.value, hunks: [] };

		return {
			path: file.path.value,
			oldPath: file.oldPath.value,
			hunks: getDiff(file.oldPath.value, file.path.value, { words: false }).changes,
		};
	}

	protected _isMarkdown(path: Path) {
		return path.extension === MarkdownExtension;
	}

	protected abstract _getDiffFiles(): Promise<DiffTree2TreeInfo>;
	protected abstract _assignResourcesToItems(res: DiffTree2TreeFile[], items: DiffItem[]): Promise<DiffResource[]>;
	protected abstract _getNewOrModifiedDiffItem(files: DiffTree2TreeFile): Promise<DiffItem>;
}
