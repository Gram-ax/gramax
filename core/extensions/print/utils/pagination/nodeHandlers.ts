import codeBlockHandler from "@ext/markdown/elements/codeBlockLowlight/print/codeBlockHandler";
import headingHandler from "@ext/markdown/elements/heading/print/headingHandler";
import annotationListHandler from "@ext/markdown/elements/image/print/annotationHandler";
import imageHandler from "@ext/markdown/elements/image/print/imageHandler";
import listHandler from "@ext/markdown/elements/list/print/listHandler";
import noteHandler from "@ext/markdown/elements/note/print/noteHandler";
import paragraphHandler from "@ext/markdown/elements/paragraph/print/paragraphHandler";
import snippetHandler from "@ext/markdown/elements/snippet/print/snippetHandler";
import tableHandler from "@ext/markdown/elements/table/print/tableHandler";
import tabsHandler from "@ext/markdown/elements/tabs/print/tabsHandler";
import viewHandler from "@ext/markdown/elements/view/print/viewHandler";
import type Paginator from "@ext/print/utils/pagination/Paginator";

export type PrintNodeHandlerFn = (node: HTMLElement, paginator: Paginator) => Promise<boolean> | boolean;

export interface PrintNodeHandler {
	isRequired?: boolean;
	handle: PrintNodeHandlerFn;
}

export interface PrintHandlerGroups {
	required: PrintNodeHandlerFn[];
	conditional: PrintNodeHandlerFn[];
}

const printNodeHandlers: PrintNodeHandler[] = [
	imageHandler,
	headingHandler,
	paragraphHandler,
	tableHandler,
	codeBlockHandler,
	listHandler,
	snippetHandler,
	noteHandler,
	tabsHandler,
	viewHandler,
	annotationListHandler,
];

const printHandlers: PrintHandlerGroups = {
	conditional: printNodeHandlers.filter((h) => !h.isRequired).map((h) => h.handle),
	required: printNodeHandlers.filter((h) => h.isRequired).map((h) => h.handle),
};

export default printHandlers;
