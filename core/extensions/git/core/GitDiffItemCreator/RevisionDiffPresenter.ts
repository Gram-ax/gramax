import Path from "@core/FileProvider/Path/Path";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import type { DiffItemOrResource, DiffItemResourceCollection, DiffResource } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import assert from "assert";

export type RevisionDiffPresenterInit = {
	oldRoot: string;
	newRoot: string;
	oldItems: ItemLink[];
	newItems: ItemLink[];
	diffItems: DiffItemResourceCollection;
};

type DiffTreeItemName = {
	name: string;
};

export type TotalOverview = {
	deleted?: number;
	modified?: number;
	added?: number;
};

export type DiffTree = {
	data: DiffFlattenTreeAnyItem[];
	overview: TotalOverview;
};

export type DiffTreeBreadcrumb = DiffTreeItemName & {
	link: string;
	path: string;
};

export type HasChilds = {
	childs: DiffTreeAnyItem[];
};

export type DiffTreeAnyItem = DiffTreeNode | DiffTreeItem;

export type DiffTreeNode = HasChilds & {
	type: "node";
	breadcrumbs: DiffTreeBreadcrumb[];
	logicpath: string;
};

export type DiffFlattenTreeNode = Omit<DiffTreeNode, "childs"> & {
	hasChilds: boolean;
	indent: number;
};

export type DiffFlattenTreeItemType = Omit<DiffTreeItemType, "childs"> & {
	hasChilds: boolean;
	indent: number;
};

export type DiffFlattenTreeResourceType = Omit<DiffTreeResourceType, "childs"> & {
	hasChilds: boolean;
	indent: number;
};

export type DiffFlattenTreeItem = DiffFlattenTreeItemType | DiffFlattenTreeResourceType;

export type DiffFlattenTreeAnyItem = DiffFlattenTreeNode | DiffFlattenTreeItem;

type DiffTreeItemBase = DiffTreeItemName & {
	icon?: string;
	filepath: {
		new: string;
		old: string;
	};
	overview: {
		added: number;
		removed: number;
		isLfs: boolean;
		size: number;
		status: FileStatus;
	};
	isChanged: boolean;
};

type DiffTreeItemType = DiffTreeItemBase &
	HasChilds & {
		type: "item";
		logicpath: string;
		resources: DiffResource[];
	};

type DiffTreeResourceType = DiffTreeItemBase &
	HasChilds & {
		type: "resource";
		parentPath?: DiffResource["parentPath"];
	};

export type DiffTreeItem = DiffTreeItemType | DiffTreeResourceType;

const DIFF_ITEM_ICONS = {
	json: "settings",
	yaml: "settings",
	yml: "settings",
	mp3: "file-music",
	wav: "file-music",
	ogg: "file-music",
	mp4: "file-video",
	mpg: "file-video",
	avi: "file-video",
	jpg: "file-image",
	jpeg: "file-image",
	png: "file-image",
	gif: "file-image",
	svg: "file-image",
	puml: "file-image",
	mermaid: "file-image",
	webp: "file-image",
	ico: "file-image",
	pdf: "file-type",
	doc: "file-type",
	docx: "file-type",
	xls: "file-type",
	xlsx: "file-type",
};

export default class RevisionDiffPresenter {
	private _newRoot: string;
	private _oldRoot: string;
	private _newItems: ItemLink[];
	private _oldItems: ItemLink[];

	private _items: DiffItemResourceCollection;
	private _links: ItemLink[];
	private _root: string;

	constructor(init: RevisionDiffPresenterInit) {
		this._newRoot = init.newRoot;
		this._oldRoot = init.oldRoot;
		this._newItems = init.newItems;
		this._oldItems = init.oldItems;
		this._items = init.diffItems;
	}

	present(): DiffTree {
		this._root = this._newRoot;
		this._links = this._newItems;
		const overview = this._countTotalOverview();

		const newFlat = this._collectItemsFlat(false);

		const resources = this._items.resources;
		this._links = this._oldItems;
		this._root = this._oldRoot;
		this._items = {
			items: this._items.items.filter((i) => i.status === FileStatus.delete),
			resources: [],
		};

		const oldFlat = this._collectItemsFlat(true);

		this._mergeFlatInto(newFlat, oldFlat);
		resources.forEach((r) => newFlat.push(this._toFlatItem(this._transformIntoResource(r), 0)));
		return { data: newFlat, overview };
	}

	private _collectItemsFlat(old: boolean): DiffFlattenTreeAnyItem[] {
		assert(this._items, "diffItems is required to not be undefined");
		assert(this._links, "links is required to not be undefined");

		const paths = this._items.items.map((item) =>
			old ? item.filePath.oldPath || item.filePath.path : item.filePath.path,
		);
		return this._walkFlat(paths, this._links, 0);
	}

	private _walkFlat(
		filepaths: string[],
		items: ItemLink[],
		indent: number,
		parentBreadcrumbs?: DiffTreeBreadcrumb[],
	): DiffFlattenTreeAnyItem[] {
		const result: DiffFlattenTreeAnyItem[] = [];

		for (const item of items) {
			if (filepaths.length === 0) break;

			const resolved = this._filterItemByPaths(filepaths, item);
			const entry = resolved ? this._transformIntoItem(resolved) : null;

			let nodeOutput: DiffFlattenTreeAnyItem[] = [];
			if (item.type === ItemType.category) {
				const currentBreadcrumb = this._transformIntoBreadcrumb(item);
				const accumulatedBreadcrumbs = (parentBreadcrumbs ?? []).concat(currentBreadcrumb);

				const childsFlat = this._walkFlat(
					filepaths,
					(item as CategoryLink).items,
					indent + 1,
					accumulatedBreadcrumbs,
				);

				if (childsFlat.length > 0) {
					const node = this._createNode(item, entry ? [] : [currentBreadcrumb]);
					const directChildIndent = indent + 1;
					const directChildren = childsFlat.filter((c) => c.indent === directChildIndent);
					const isPart = directChildren.length === 1;
					const firstDirectChild = directChildren[0];
					const isRootOrPartOfBreadcrumbChain =
						!parentBreadcrumbs?.length || (parentBreadcrumbs.length > 0 && node.breadcrumbs.length > 0);
					const hasMeaningfulBreadcrumbs =
						node.breadcrumbs.length > 0 && node.breadcrumbs.some((b) => (b.name ?? "").trim().length > 0);

					if (
						isPart &&
						firstDirectChild.type === "node" &&
						isRootOrPartOfBreadcrumbChain &&
						hasMeaningfulBreadcrumbs
					) {
						nodeOutput = childsFlat.map((c) => {
							const withIndent = { ...c, indent: c.indent - 1 };
							if (c.type === "node" && node.breadcrumbs.length > 0) {
								return { ...withIndent, breadcrumbs: [...node.breadcrumbs, ...c.breadcrumbs] };
							}
							return withIndent;
						});
					} else if (node.breadcrumbs.length > 0) {
						nodeOutput = [this._toFlatNode(node, indent, childsFlat.length > 0), ...childsFlat];
					} else {
						nodeOutput = childsFlat;
					}
				}
			}

			if (entry) {
				const resourcesFlat = entry.childs
					.filter((c) => c.type !== "node")
					.map((c) => this._toFlatItem(c, indent + 1));
				result.push(this._toFlatItem(entry, indent));
				result.push(...nodeOutput);
				result.push(...resourcesFlat);
			} else if (nodeOutput.length > 0) {
				result.push(...nodeOutput);
			}
		}

		return result;
	}

	private _toFlatNode(node: DiffTreeNode, indent: number, hasChilds = false): DiffFlattenTreeNode {
		const { childs, ...rest } = node;
		return { ...rest, indent, hasChilds };
	}

	private _toFlatItem(item: DiffTreeItem, indent: number): DiffFlattenTreeAnyItem {
		const { childs, ...rest } = item;
		return { ...rest, indent, hasChilds: childs.length > 0 };
	}

	private _mergeFlatInto(newFlat: DiffFlattenTreeAnyItem[], oldFlat: DiffFlattenTreeAnyItem[]): void {
		let i = 0;
		while (i < oldFlat.length) {
			const oldItem = oldFlat[i];

			if (oldItem.type === "item" || oldItem.type === "resource") {
				const existsInNew = newFlat.some(
					(n) => (n.type === "item" || n.type === "resource") && n.filepath.old === oldItem.filepath.old,
				);
				if (!existsInNew) newFlat.push(oldItem);
				i++;
				continue;
			}

			const { subtree: oldSubtree, endIndex: oldEnd } = this._extractSubtree(oldFlat, i);
			i = oldEnd;

			const newIdx = newFlat.findIndex((n) => n.type === "node" && n.logicpath === oldItem.logicpath);

			if (newIdx === -1) {
				newFlat.push(oldItem, ...oldSubtree);
				continue;
			}

			const { subtree: newSubtree, endIndex: newEnd } = this._extractSubtree(newFlat, newIdx);
			this._mergeFlatInto(newSubtree, oldSubtree);
			newFlat.splice(newIdx + 1, newEnd - newIdx - 1, ...newSubtree);
		}
	}

	private _extractSubtree(
		flat: DiffFlattenTreeAnyItem[],
		startIndex: number,
	): { subtree: DiffFlattenTreeAnyItem[]; endIndex: number } {
		const parentIndent = flat[startIndex].indent;
		const subtree: DiffFlattenTreeAnyItem[] = [];
		let i = startIndex + 1;

		while (i < flat.length && flat[i].indent > parentIndent) {
			subtree.push(flat[i]);
			i++;
		}

		return { subtree, endIndex: i };
	}

	private _filterItemByPaths(filepaths: string[], link: ItemLink | CategoryLink): ItemLink | null {
		const index = filepaths.findIndex((p) => this._resolveFullPath(p) === link.ref.path);

		if (index !== -1) {
			filepaths.splice(index, 1);
			return link;
		}

		return null;
	}

	private _createNode(item: ItemLink, breadcrumbs?: DiffTreeBreadcrumb[]): DiffTreeNode {
		return {
			type: "node",
			breadcrumbs: breadcrumbs || [],
			logicpath: item.pathname.split("/").slice(5).join("/"),
			childs: [],
		};
	}

	private _transformIntoItem(item: ItemLink): DiffTreeItem {
		assert(item);
		const name = this._resolveTitle(item.title, item.ref.path);

		const diffItem = this._items.items.find((i) => this._resolveFullPath(i.filePath.path) === item.ref.path);
		assert(item, `DiffItem is expected, but not found for breadcrumb ${item.ref.path}`);

		const childs = diffItem.resources?.map((r) => this._transformIntoResource(r));
		const logicpath = item.pathname.split("/").slice(5).join("/");

		return {
			name,
			filepath: {
				new: diffItem.filePath.path,
				old: diffItem.filePath.oldPath || diffItem.filePath.path,
			},
			logicpath,
			type: "item",
			isChanged: diffItem.isChanged,
			resources: diffItem.resources || [],
			overview: {
				added: diffItem.added ?? 0,
				removed: diffItem.deleted ?? 0,
				isLfs: diffItem.isLfs,
				size: diffItem.size,
				status: diffItem.status,
			},
			childs,
		};
	}

	private _transformIntoResource(resource: DiffResource): DiffTreeItem {
		const name = this._resolveTitle(resource.title, resource.filePath.path);

		return {
			name,
			icon: this._resolveFileIconByExt(resource.filePath.path),
			filepath: {
				new: resource.filePath.path,
				old: resource.filePath.oldPath || resource.filePath.path,
			},
			type: "resource",
			isChanged: resource.isChanged,
			parentPath: resource.parentPath,
			overview: {
				added: resource.added,
				removed: resource.deleted,
				isLfs: resource.isLfs,
				size: resource.size,
				status: resource.status,
			},
			childs: [],
		};
	}

	private _countTotalOverview() {
		assert(this._items, "diffItems should be set at this point");

		const init: TotalOverview = { deleted: 0, modified: 0, added: 0 };

		const callback = (prev: TotalOverview, curr: DiffItemOrResource) => {
			if (curr.status === FileStatus.delete) prev.deleted++;
			if (curr.status === FileStatus.modified) prev.modified++;
			if (curr.status === FileStatus.new) prev.added++;
			if (curr.type === "item") curr.resources?.reduce(callback, prev);

			return prev;
		};

		this._items.items?.reduce(callback, init);
		this._items.resources?.reduce(callback, init);

		return init;
	}

	private _transformIntoBreadcrumb(item: ItemLink): DiffTreeBreadcrumb {
		const name = this._resolveTitle(item.title, item.ref.path);
		return { name, link: item.pathname, path: item.ref.path };
	}

	private _resolveTitle(title?: string, path?: string, oldPath?: string): string {
		return title || path?.split("/").pop() || oldPath?.split("/").pop();
	}

	private _resolveFileIconByExt(path: string): string | null {
		const ext = new Path(path).extension;
		return DIFF_ITEM_ICONS[ext] || "binary";
	}

	private _resolveFullPath(path: string): string {
		return `${this._root}/${path}`;
	}
}
