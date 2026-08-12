import codeBlockHandler from "@ext/markdown/elements/codeBlockLowlight/print/codeBlockHandler";
import fragmentHandler from "@ext/markdown/elements/fragment/print/fragmentHandler";
import headingHandler from "@ext/markdown/elements/heading/print/headingHandler";
import annotationListHandler from "@ext/markdown/elements/image/print/annotationHandler";
import imageHandler from "@ext/markdown/elements/image/print/imageHandler";
import listHandler from "@ext/markdown/elements/list/print/listHandler";
import noteHandler from "@ext/markdown/elements/note/print/noteHandler";
import openApiHandler from "@ext/markdown/elements/openApi/print/openApiHandler";
import paragraphHandler from "@ext/markdown/elements/paragraph/print/paragraphHandler";
import tableHandler from "@ext/markdown/elements/table/print/tableHandler";
import tabsHandler from "@ext/markdown/elements/tabs/print/tabsHandler";
import viewHandler from "@ext/markdown/elements/view/print/viewHandler";
import type Paginator from "@ext/print/utils/pagination/Paginator";

export type PrintNodeHandlerFn = (node: HTMLElement, paginator: Paginator) => Promise<boolean> | boolean;

/**
 * A block whose content arrives after React reports the article as rendered — a lazy chunk, a fetch — settles
 * itself here. Without it the paginator measures a skeleton and lays out every later page against a height
 * that is about to change.
 */
export type PrintReadyFn = (source: HTMLElement, signal?: AbortSignal) => Promise<void>;

export interface PrintNodeHandler {
	isRequired?: boolean;
	handle: PrintNodeHandlerFn;
	waitForReady?: PrintReadyFn;
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
	fragmentHandler,
	noteHandler,
	openApiHandler,
	tabsHandler,
	viewHandler,
	annotationListHandler,
];

const printHandlers: PrintHandlerGroups = {
	conditional: printNodeHandlers.filter((h) => !h.isRequired).map((h) => h.handle),
	required: printNodeHandlers.filter((h) => h.isRequired).map((h) => h.handle),
};

/** Settles every block that declares a readiness rule, so pagination measures final heights and not skeletons. */
export const waitForPrintableContent = async (source: HTMLElement, signal?: AbortSignal): Promise<void> => {
	await Promise.all(printNodeHandlers.map((handler) => handler.waitForReady?.(source, signal) ?? Promise.resolve()));
};

export default printHandlers;
