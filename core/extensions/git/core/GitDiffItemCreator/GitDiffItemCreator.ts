import Path from "../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import { Article } from "../../../../logic/FileStructue/Article/Article";
import { Catalog } from "../../../../logic/FileStructue/Catalog/Catalog";
import { Category } from "../../../../logic/FileStructue/Category/Category";
import FileStructure from "../../../../logic/FileStructue/FileStructure";
import ItemExtensions from "../../../../logic/FileStructue/Item/ItemExtensions";
import ResourceExtensions from "../../../../logic/Resource/ResourceExtensions";
import SitePresenter from "../../../../logic/SitePresenter/SitePresenter";
import { getDiff, getMatchingPercent } from "../../../VersionControl/DiffHandler/DiffHandler";
import { Change } from "../../../VersionControl/DiffHandler/model/Change";
import DiffItem from "../../../VersionControl/model/DiffItem";
import DiffResource from "../../../VersionControl/model/DiffResource";
import VersionControlType from "../../../VersionControl/model/VersionControlType";
import { FileStatus } from "../../../Watchers/model/FileStatus";
import GitVersionControl from "../GitVersionControl/GitVersionControl";
import { GitStatus } from "../GitWatcher/model/GitStatus";

export default class GitDiffItemCreator {
	private _gitVersionControl: GitVersionControl;

	constructor(
		private _catalog: Catalog,
		private _fp: FileProvider,
		private _sp: SitePresenter,
		private _fs: FileStructure,
	) {}

	public async getDiffItems(): Promise<{ items: DiffItem[]; resources: DiffResource[] }> {
		const versionControl = await this._catalog.getVersionControl();
		if (!versionControl || versionControl.getType() !== VersionControlType.git) return { items: [], resources: [] };

		this._gitVersionControl = versionControl as GitVersionControl;

		const changeFiles = await this._getChangeFiles();
		const { items: diffItems, resources } = await this._getDiffItems(changeFiles.items, changeFiles.resources);

		const renamedDiffItems = this._findRenames(diffItems);
		if (resources.length === 0) return { items: renamedDiffItems, resources: [] };

		const changeResources = await this._addDiffResources(resources, renamedDiffItems);
		const diffResources = await Promise.all(changeResources.map((c) => this._getDiffResource(c)));

		return { items: renamedDiffItems, resources: diffResources };
	}

	private async _getOldContent(path: Path, isNew = false): Promise<string> {
		if (isNew) return "";
		const content = await this._gitVersionControl.showLastCommitContent(path);
		return content ? content : "";
	}

	private async _getNewContent(path: Path, isDelete = false): Promise<string> {
		if (isDelete) return "";
		const content = await this._fp.read(this._catalog.getItemRefPath(path));
		return content ? content : "";
	}

	private async _getDiffByPath(
		path: Path,
		isNew = false,
		isDelete = false,
	): Promise<{ changes: Change[]; added: number; removed: number }> {
		const oldContent = await this._getOldContent(path, isNew);
		const newContent = await this._getNewContent(path, isDelete);
		return getDiff(oldContent, newContent);
	}

	private _findRenames(items: DiffItem[]): DiffItem[] {
		function replaceToRenamedDiffItem(
			diffItems: DiffItem[],
			removedFile: DiffItem,
			addedFile: DiffItem,
		): DiffItem[] {
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
			diffItems[addedIdx] = addedDiffItem;
			diffItems[removedIdx] = null;
			return diffItems;
		}

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
			arrayWithRenames = replaceToRenamedDiffItem(arrayWithRenames, removedFile, matching.file);
		});

		return arrayWithRenames.filter((x) => x);
	}

	private async _getChangeFiles(): Promise<{
		items: GitStatus[];
		resources: GitStatus[];
	}> {
		const items: GitStatus[] = [];
		const resources: GitStatus[] = [];
		(await this._gitVersionControl.getChanges())
			.filter((c) => c.isUntracked)
			.forEach((c) => {
				if (ItemExtensions.includes(c.path.allExtensions?.[0] ?? "")) return items.push(c);
				return resources.push(c);
			});

		return { items, resources };
	}

	private async _getDiffResource(changeFile: GitStatus): Promise<DiffResource> {
		const isNew = changeFile.type === FileStatus.new;
		const isDelete = changeFile.type === FileStatus.delete;
		return {
			changeType: changeFile.type,
			type: "resource",
			isChanged: true,
			filePath: { path: changeFile.path.value },
			title: changeFile.path.nameWithExtension,
			content: await this._getNewContent(changeFile.path),
			diff: ResourceExtensions.images.includes(changeFile.path.extension)
				? null
				: await this._getDiffByPath(changeFile.path, isNew, isDelete),
		};
	}
	private async _getDiffItems(
		changeFiles: GitStatus[],
		resources: GitStatus[],
	): Promise<{ items: DiffItem[]; resources: GitStatus[] }> {
		const diffItems: DiffItem[] = [];
		for (const c of changeFiles) {
			if (c.type === FileStatus.delete) {
				const oldContent = await this._getOldContent(c.path);
				diffItems.push({
					type: "item",
					changeType: FileStatus.delete,
					title: this._fs.parseMarkdown(oldContent).props.title,
					filePath: { path: c.path.value },
					content: oldContent,
					diff: await this._getDiffByPath(c.path, false, true),
					resources: [],
					isChanged: true,
				});
				continue;
			}
			const itemRef = this._fp.getItemRef(this._catalog.getItemRefPath(c.path));
			const item = this._catalog.findItemByItemRef(itemRef) as Article | Category;
			if (!item) {
				resources.push(c);
				continue;
			}

			diffItems.push(
				await this._getDiffItemByItem({
					item,
					isNew: c.type === FileStatus.new,
					isChanged: true,
				}),
			);
		}
		return { items: diffItems.filter((c) => c), resources };
	}

	private async _getDiffItemByItem({
		item,
		isChanged,
		isNew = false,
		isDelete = false,
		resources = [],
	}: {
		item: Article | Category;
		isChanged: boolean;
		isNew?: boolean;
		isDelete?: boolean;
		resources?: DiffResource[];
	}): Promise<DiffItem> {
		const relativeRepPath = this._catalog.getRelativeRepPath(item.ref);
		let changeType: FileStatus = FileStatus.modified;
		if (isNew) changeType = FileStatus.new;
		else if (isDelete) changeType = FileStatus.delete;
		return {
			type: "item",
			changeType,
			title: item.props.title,
			logicPath: item.logicPath,
			filePath: { path: relativeRepPath.value },
			content: await this._getNewContent(relativeRepPath),
			diff: await this._getDiffByPath(relativeRepPath, isNew, isDelete),
			resources,
			isChanged,
		};
	}

	private async _addDiffResources(changeResources: GitStatus[], diffItems: DiffItem[]): Promise<GitStatus[]> {
		const itemResources: GitStatus[] = [];
		this._catalog = await this._sp.parseAllItems(this._catalog);
		for (const changeFile of changeResources) {
			for (const item of this._catalog.getContentItems()) {
				if (!item.parsedContent) continue;
				const resourceManager = item.parsedContent.resourceManager;
				for (const path of resourceManager.resources) {
					if (resourceManager.getAbsolutePath(path).endsWith(changeFile.path)) {
						itemResources.push(changeFile);
						const diffResource = await this._getDiffResource(changeFile);
						let includes = false;
						diffItems.forEach((diffItem) => {
							const diffItemResourcePaths = diffItem.resources.map((resource) => resource.filePath.path);
							if (
								!diffItemResourcePaths.includes(diffResource.filePath.path) &&
								diffItem.logicPath === item.logicPath
							) {
								diffItem.resources.push(diffResource);
								includes = true;
							}
						});

						if (!includes) {
							diffItems.push(
								await this._getDiffItemByItem({
									item,
									isChanged: false,
									resources: [diffResource],
								}),
							);
						}
					}
				}
			}
		}
		return changeResources.filter((r) => !itemResources.includes(r));
	}
}
