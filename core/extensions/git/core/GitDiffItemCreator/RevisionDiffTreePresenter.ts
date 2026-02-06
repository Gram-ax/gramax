import Path from "@core/FileProvider/Path/Path";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import type {
	DiffItem,
	DiffItemOrResource,
	DiffItemResourceCollection,
	DiffResource,
} from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import assert from "assert";

export type RevisionDiffTreePresenterInit = {
	oldRoot: string;
	newRoot: string;
	oldItems: ItemLink[];
	newItems: ItemLink[];
	diffItems: DiffItemResourceCollection;
};

type DiffTreeItemName = {
	isTitle: boolean;
	name: string;
};

export type TotalOverview = {
	deleted?: number;
	modified?: number;
	added?: number;
};

export type DiffTree = {
	tree: DiffTreeAnyItem[];
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

export type DiffTreeItem = DiffTreeItemName &
	HasChilds & {
		type: "item" | "resource";
		status: FileStatus;

		rawItem: DiffItem | DiffResource;
		order?: number;
		icon?: string;
		logicpath?: string;
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
	};

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

export default class RevisionDiffTreePresenter {
	private _newRoot: string;
	private _oldRoot: string;
	private _newItems: ItemLink[];
	private _oldItems: ItemLink[];

	private _items: DiffItemResourceCollection;
	private _links: ItemLink[];
	private _root: string;

	constructor(init: RevisionDiffTreePresenterInit) {
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

		const newTree = this._collectItems(false);

		const resources = this._items.resources;
		this._links = this._oldItems;
		this._root = this._oldRoot;
		this._items = {
			items: this._items.items.filter((i) => i.status === FileStatus.delete),
			resources: [],
		};

		const oldTree = this._collectItems(true);

		this._mergeTreesIntoNew(newTree, oldTree);
		resources.forEach((r) => newTree.push(this._transformIntoResource(r)));

		return { tree: newTree, overview };
	}

	private _mergeTreesIntoNew(newTree: DiffTreeAnyItem[], oldTree: DiffTreeAnyItem[]) {
		for (const oldItem of oldTree) {
			const newItem = newTree.find((i) => i.logicpath === oldItem.logicpath && i.type === "node");
			if (!newItem || newItem.type !== "node" || oldItem.type !== "node") {
				newTree.push(oldItem);
				continue;
			}

			if (newItem.type === "node" && oldItem.type === "node") {
				for (const old of oldItem.childs) {
					if (old.type === "item") newItem.childs.push(old);
					else this._mergeTreesIntoNew(newItem.childs, old.childs);
				}
			}
		}
	}

	private _collectItems(old: boolean): DiffTreeAnyItem[] {
		assert(this._items, "diffItems is required to not be undefined");
		assert(this._links, "links is required to not be undefined");

		const paths = this._items.items.map((item) =>
			old ? item.filePath.oldPath || item.filePath.path : item.filePath.path,
		);
		const entries = this._walk(paths, this._links);

		return entries;
	}

	private _walk(filepaths: string[], items: ItemLink[]): DiffTreeAnyItem[] {
		const result: DiffTreeAnyItem[] = [];

		for (const item of items) {
			if (filepaths.length === 0) break;

			const resolved = this._filterItemByPaths(filepaths, item);
			const entry = resolved ? this._transformIntoItem(resolved) : null;

			if (item.type === ItemType.category) {
				const nextParents = entry ? [] : [item];
				const childs = this._walk(filepaths, (item as CategoryLink).items);

				if (childs?.length) {
					const node = this._createNode(item, nextParents.map(this._transformIntoBreadcrumb.bind(this)));
					node.childs = childs;
					entry ? entry.childs.push(node) : result.push(node);
				}
			}

			if (entry) result.push(entry);
		}

		return result;
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
		const { isTitle, name } = this._resolveTitle(item.title, item.ref.path);

		const diffItem = this._items.items.find((i) => this._resolveFullPath(i.filePath.path) === item.ref.path);
		assert(item, `DiffItem is expected, but not found for breadcrumb ${item.ref.path}`);

		const childs = diffItem.resources?.map((r) => this._transformIntoResource(r));
		const logicpath = item.pathname.split("/").slice(5).join("/");

		return {
			name,
			isTitle,
			status: diffItem.status,
			icon: null,

			filepath: {
				new: diffItem.filePath.path,
				old: diffItem.filePath.oldPath || diffItem.filePath.path,
			},
			logicpath,
			rawItem: diffItem,
			type: "item",
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
		const { isTitle, name } = this._resolveTitle(resource.title, resource.filePath.path);

		return {
			name,
			isTitle,
			status: resource.status,
			icon: this._resolveFileIconByExt(resource.filePath.path),
			filepath: {
				new: resource.filePath.path,
				old: resource.filePath.oldPath || resource.filePath.path,
			},
			rawItem: resource,
			type: "resource",
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
		const { isTitle, name } = this._resolveTitle(item.title, item.ref.path);
		return { isTitle, name, link: item.pathname, path: item.ref.path };
	}

	private _resolveTitle(title?: string, path?: string, oldPath?: string): DiffTreeItemName {
		const isTitle = !!title;
		const name = title || path?.split("/").pop() || oldPath?.split("/").pop();

		return { isTitle, name };
	}

	private _resolveFileIconByExt(path: string): string | null {
		const ext = new Path(path).extension;
		return DIFF_ITEM_ICONS[ext] || "binary";
	}

	private _resolveFullPath(path: string): string {
		return this._root + "/" + path;
	}
}
