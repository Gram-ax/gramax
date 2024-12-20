import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import FileStructure from "@core/FileStructue/FileStructure";
import ItemExtensions from "@core/FileStructue/Item/ItemExtensions";
import ResourceExtensions from "@core/Resource/ResourceExtensions";
import SitePresenter from "@core/SitePresenter/SitePresenter";
import GitDiffItemAliases from "@ext/git/core/GitDiffItemCreator/GitDiffItemAliases";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import { getDiff, getMatchingPercent } from "@ext/VersionControl/DiffHandler/DiffHandler";
import { Change } from "@ext/VersionControl/DiffHandler/model/Change";
import DiffItem from "@ext/VersionControl/model/DiffItem";
import DiffResource from "@ext/VersionControl/model/DiffResource";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

export default abstract class GitDiffItemCreatorBase {
	protected _gitVersionControl: GitVersionControl;
	protected _fp: FileProvider;

	constructor(protected _catalog: ReadonlyCatalog, protected _sp: SitePresenter, protected _fs: FileStructure) {
		this._gitVersionControl = this._catalog.repo.gvc;
		this._fp = _fs.fp;
	}

	public async getDiffItems(): Promise<{ items: DiffItem[]; resources: DiffResource[] }> {
		if (!this._gitVersionControl) return { items: [], resources: [] };
		const changeFiles = await this._getChangeFiles();
		const { items: diffItems, resources } = await this._getDiffItems(changeFiles.items, changeFiles.resources);
		const renamedDiffItems = this._findRenames(diffItems);
		if (resources.length === 0) {
			GitDiffItemAliases.applyAliases(renamedDiffItems);
			return { items: renamedDiffItems, resources: [] };
		}

		const changeResources = await this._addDiffResources(resources, renamedDiffItems);
		const diffResources = await Promise.all(changeResources.map((c) => this._getDiffResource(c)));

		GitDiffItemAliases.applyAliases(renamedDiffItems);
		GitDiffItemAliases.applyAliases(diffResources);

		return { items: renamedDiffItems, resources: diffResources };
	}

	private async _getDiffItems(
		changeFiles: GitStatus[],
		resources: GitStatus[],
	): Promise<{ items: DiffItem[]; resources: GitStatus[] }> {
		const diffItems: DiffItem[] = [];
		for (const c of changeFiles) {
			if (c.status === FileStatus.delete) {
				const oldDiffItem = await this._getOldDiffItem(c);
				diffItems.push(oldDiffItem);
				continue;
			}
			const diffItem = await this._getNewOrModifiedDiffItem(c);
			if (!diffItem) {
				resources.push(c);
				continue;
			}
			diffItems.push(diffItem);
		}
		return { items: diffItems.filter((c) => c), resources };
	}

	private _findRenames(items: DiffItem[]): DiffItem[] {
		const THRESHOLD = 50;
		let arrayWithRenames = [...items];
		const removedFiles = items.filter((item) => item.changeType === FileStatus.delete && item.content);
		const addedFiles = items.filter((item) => item.changeType === FileStatus.new && item.content);
		if (removedFiles.length === 0 || addedFiles.length === 0) return items;

		removedFiles.forEach((removedFile) => {
			let matching: { file: DiffItem; percent: number } = { file: null, percent: 0 };
			addedFiles.forEach((addedFile) => {
				const percent = getMatchingPercent(removedFile.content, addedFile.content);
				if (percent < THRESHOLD || percent <= matching.percent) return;
				matching = { file: addedFile, percent };
			});
			if (!matching.file) return;
			arrayWithRenames = this._replaceToRenamedDiffItem(arrayWithRenames, removedFile, matching.file);
		});

		return arrayWithRenames.filter((x) => x);
	}

	private _replaceToRenamedDiffItem(diffItems: DiffItem[], removedFile: DiffItem, addedFile: DiffItem): DiffItem[] {
		let addedIdx = 0;
		let removedIdx = 0;
		diffItems.forEach((diffItem, idx) => {
			if (!diffItem) return;
			if (diffItem.filePath.path === addedFile.filePath.path) addedIdx = idx;
			if (diffItem.filePath.path === removedFile.filePath.path) removedIdx = idx;
		});
		const addedDiffItem = diffItems[addedIdx];
		addedDiffItem.changeType = FileStatus.modified;
		addedDiffItem.diff = getDiff(removedFile.content, addedFile.content);
		addedDiffItem.filePath.diff = getDiff(removedFile.filePath.path, addedDiffItem.filePath.path).changes;
		addedDiffItem.filePath.oldPath = removedFile.filePath.path;
		addedDiffItem.oldEditTree = removedFile.oldEditTree;
		addedDiffItem.oldContent = removedFile.content;
		diffItems[addedIdx] = addedDiffItem;
		diffItems[removedIdx] = null;
		return diffItems;
	}

	protected async _getDiffResource(changeFile: GitStatus): Promise<DiffResource> {
		const isNew = changeFile.status === FileStatus.new;
		const isDelete = changeFile.status === FileStatus.delete;
		const isImage = ResourceExtensions.images.includes(changeFile.path.extension);
		return {
			changeType: changeFile.status,
			type: "resource",
			isChanged: true,
			filePath: { path: changeFile.path.value },
			title: changeFile.path.nameWithExtension,
			content: isImage ? "" : await this._getNewContent(changeFile.path),
			diff: isImage ? null : await this._getDiffByPath(changeFile.path, isNew, isDelete),
		};
	}

	protected async _getDiffByPath(
		path: Path,
		isNew = false,
		isDelete = false,
	): Promise<{ changes: Change[]; added: number; removed: number }> {
		const oldContent = await this._getOldContent(path, isNew);
		const newContent = await this._getNewContent(path, isDelete);
		return getDiff(oldContent, newContent);
	}

	protected async _getOldDiffItem(changeFile: GitStatus): Promise<DiffItem> {
		const oldContent = await this._getOldContent(changeFile.path);
		return {
			type: "item",
			changeType: FileStatus.delete,
			title: this._fs.parseMarkdown(oldContent).props.title,
			filePath: { path: changeFile.path.value },
			content: oldContent,
			diff: await this._getDiffByPath(changeFile.path, false, true),
			resources: [],
			isChanged: true,
		};
	}

	protected async _getChangeFiles(): Promise<{
		items: GitStatus[];
		resources: GitStatus[];
	}> {
		const items: GitStatus[] = [];
		const resources: GitStatus[] = [];
		(await this._getGitStatusFiles())
			.filter((c) => c.isUntracked)
			.forEach((c) => {
				if (
					c.path.allExtensions?.length &&
					ItemExtensions.includes(c.path.allExtensions[c.path.allExtensions.length - 1] ?? "")
				)
					return items.push(c);
				return resources.push(c);
			});

		return { items, resources };
	}

	protected abstract _getGitStatusFiles(): Promise<GitStatus[]>;
	protected abstract _getNewContent(path: Path, isDelete?: boolean): Promise<string>;
	protected abstract _getOldContent(path: Path, isNew?: boolean): Promise<string>;
	protected abstract _addDiffResources(changeResources: GitStatus[], diffItems: DiffItem[]): Promise<GitStatus[]>;
	protected abstract _getNewOrModifiedDiffItem(changeFile: GitStatus): Promise<DiffItem>;
}
