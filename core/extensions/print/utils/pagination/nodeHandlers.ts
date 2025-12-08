import type Paginator from "@ext/print/utils/pagination/Paginator";
import headingHandler from "@ext/markdown/elements/heading/print/headingHandler";
import tableHandler from "@ext/markdown/elements/table/print/tableHandler";
import codeBlockHandler from "@ext/markdown/elements/codeBlockLowlight/print/codeBlockHandler";
import listHandler from "@ext/markdown/elements/list/print/listHandler";
import snippetHandler from "@ext/markdown/elements/snippet/print/snippetHandler";
import noteHandler from "@ext/markdown/elements/note/print/noteHandler";
import tabsHandler from "@ext/markdown/elements/tabs/print/tabsHandler";

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
	headingHandler,
	tableHandler,
	codeBlockHandler,
	listHandler,
	snippetHandler,
	noteHandler,
	tabsHandler,
];

const printHandlers: PrintHandlerGroups = {
	conditional: printNodeHandlers.filter((h) => !h.isRequired).map((h) => h.handle),
	required: printNodeHandlers.filter((h) => h.isRequired).map((h) => h.handle),
};

export default printHandlers;
