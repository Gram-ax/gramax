import NodePaginator from "@ext/print/utils/pagination/NodePaginator";

export interface TablePaginatorInterface extends NodePaginator<HTMLDivElement, HTMLTableSectionElement> {
	currentContainer: HTMLTableSectionElement;
	createPage(withOutTableHeader?: boolean): HTMLTableSectionElement;
}
