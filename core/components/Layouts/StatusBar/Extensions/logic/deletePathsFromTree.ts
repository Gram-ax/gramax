import { DiffTree, DiffTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";

const deleteFromItem = (item: DiffTreeAnyItem, paths: string[], parent?: DiffTreeAnyItem | DiffTree) => {
	if (item.type === "node") {
		item.childs.forEach((c) => deleteFromItem(c, paths, item));
		return;
	}

	if (paths.includes(item.rawItem.filePath.path)) {
		if ("childs" in parent) parent.childs = parent.childs.filter((c) => c !== item);
		else parent.tree = parent.tree.filter((c) => c !== item);
	}
};

const deletePathsFromTree = (diffTree: DiffTree, paths: string[]) => {
	diffTree.tree.forEach((item) => deleteFromItem(item, paths, diffTree));
};

export default deletePathsFromTree;
