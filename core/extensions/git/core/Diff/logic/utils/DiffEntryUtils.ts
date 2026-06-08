import type {
	DiffTreeAnyItem,
	DiffTreeBreadcrumb,
	DiffTreeNode,
} from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";

export const isPartOfBreadcrumb = (node: DiffTreeNode) => node.type === "node" && node.childs.length === 1;

export const getItemChilds = (node: DiffTreeNode): DiffTreeAnyItem[] | null => {
	if (isPartOfBreadcrumb(node) && node.childs[0].type === "node") return getItemChilds(node.childs[0]);

	return node.childs;
};

export const getBreadcrumbs = (node: DiffTreeNode, breadcrumbs: DiffTreeBreadcrumb[]): DiffTreeBreadcrumb[] => {
	if (!isPartOfBreadcrumb(node)) return;
	breadcrumbs.push(...node.breadcrumbs);
	getBreadcrumbs(node.childs[0] as DiffTreeNode, breadcrumbs);
};
