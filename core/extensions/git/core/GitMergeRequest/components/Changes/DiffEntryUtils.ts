import {
	DiffTreeBreadcrumb,
	DiffTreeItem,
	DiffTreeNode,
} from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";

export const isPartOfBreadcrumb = (node: DiffTreeNode) => node.type === "node" && node.childs.length === 1;

export const getItemChilds = (node: DiffTreeNode): DiffTreeItem[] | null => {
	if (isPartOfBreadcrumb(node) && node.childs[0].type === "node") return getItemChilds(node.childs[0]);

	return node.childs as DiffTreeItem[];
};

export const getBreadcrumbs = (node: DiffTreeNode, breadcrumbs: DiffTreeBreadcrumb[]): DiffTreeBreadcrumb[] => {
	if (!isPartOfBreadcrumb(node)) return;
	breadcrumbs.push(...node.breadcrumbs);
	getBreadcrumbs(node.childs[0] as DiffTreeNode, breadcrumbs);
};
