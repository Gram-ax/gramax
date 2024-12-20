import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { Item } from "@core/FileStructue/Item/Item";
import GitDiffItemCreatorBase from "@ext/git/core/GitDiffItemCreator/GitDiffItemCreatorBase";
import Path from "../../../../logic/FileProvider/Path/Path";
import FileStructure from "../../../../logic/FileStructue/FileStructure";
import SitePresenter from "../../../../logic/SitePresenter/SitePresenter";
import DiffItem from "../../../VersionControl/model/DiffItem";
import DiffResource from "../../../VersionControl/model/DiffResource";
import { FileStatus } from "../../../Watchers/model/FileStatus";
import { GitStatus } from "../GitWatcher/model/GitStatus";

export default class GitDiffItemCreator extends GitDiffItemCreatorBase {
	constructor(_catalog: ReadonlyCatalog, _sp: SitePresenter, fs: FileStructure) {
		super(_catalog, _sp, fs);
	}

	protected async _getOldContent(path: Path, isNew = false): Promise<string> {
		if (isNew) return "";
		try {
			return await this._gitVersionControl.showLastCommitContent(path);
		} catch (ex) {
			return "";
		}
	}

	protected async _getNewContent(path: Path, isDelete = false): Promise<string> {
		if (isDelete) return "";
		const filePath = this._catalog.getItemRefPath(path);
		if (await this._fp.isFolder(filePath)) return "";
		const content = (await this._fp.exists(filePath)) && (await this._fp.read(filePath));
		return content ?? "";
	}

	protected async _getGitStatusFiles(): Promise<GitStatus[]> {
		return await this._gitVersionControl.getChanges();
	}

	protected async _getNewOrModifiedDiffItem(changeFile: GitStatus): Promise<DiffItem> {
		const itemRef = this._fp.getItemRef(this._catalog.getItemRefPath(changeFile.path));
		const item = this._catalog.findItemByItemRef(itemRef);
		if (!item) return null;
		return this._getDiffItemByItem({
			item,
			isNew: changeFile.status === FileStatus.new,
			isChanged: true,
		});
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

	private async _getDiffItemByItem({
		item,
		isChanged,
		isNew = false,
		isDelete = false,
		resources = [],
	}: {
		item: Item;
		isChanged: boolean;
		isNew?: boolean;
		isDelete?: boolean;
		resources?: DiffResource[];
	}): Promise<DiffItem> {
		const relativeRepPath = this._catalog.getRepositoryRelativePath(item.ref);
		let changeType: FileStatus = FileStatus.modified;
		if (isNew) changeType = FileStatus.new;
		else if (isDelete) changeType = FileStatus.delete;
		return {
			type: "item",
			changeType,
			title: item.getTitle(),
			logicPath: await this._catalog.getPathname(item),
			filePath: { path: relativeRepPath.value },
			content: await this._getNewContent(relativeRepPath),
			diff: await this._getDiffByPath(relativeRepPath, isNew, isDelete),
			resources,
			isChanged,
		};
	}

	protected async _addDiffResources(changeResources: GitStatus[], diffItems: DiffItem[]): Promise<GitStatus[]> {
		const itemResources: GitStatus[] = [];
		this._catalog = await this._sp.parseAllItems(this._catalog);
		for (const changeFile of changeResources) {
			for (const item of this._catalog.getContentItems()) {
				if (!item.parsedContent) continue;
				const linkManager = item.parsedContent.linkManager;
				const resourceManager = item.parsedContent.resourceManager;
				for (const path of [...resourceManager.resources, ...linkManager.resources]) {
					if (resourceManager.getAbsolutePath(path).endsWith(changeFile.path)) {
						itemResources.push(changeFile);
						const diffResource = await this._getDiffResource(changeFile);
						let includes = false;
						for (const diffItem of diffItems) {
							const diffItemResourcePaths = diffItem.resources.map((resource) => resource.filePath.path);
							if (
								!diffItemResourcePaths.includes(diffResource.filePath.path) &&
								diffItem.logicPath === (await this._catalog.getPathname(item))
							) {
								diffItem.resources.push(diffResource);
								includes = true;
							}
						}

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
