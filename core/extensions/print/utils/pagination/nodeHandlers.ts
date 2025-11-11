import { AccumulatedHeight, NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import { ProgressTracker } from "./progress";
import { YieldFn } from "@ext/markdown/elements/table/print/tablePagination";
import headingHandler from "@ext/markdown/elements/heading/print/headingHandler";
import tableHandler from "@ext/markdown/elements/table/print/tableHandler";
import codeBlockHandler from "@ext/markdown/elements/codeBlockLowlight/print/codeBlockHandler";
import listHandler from "@ext/markdown/elements/list/print/listHandler";

export interface PaginationState {
	currentPage: HTMLElement;
	fragment: DocumentFragment;
	accumulatedHeight: AccumulatedHeight;
}

interface HandlerContext {
	pages: HTMLElement;
	nodeDimension: NodeDimensions;
	yieldTick: YieldFn;
	progress: ProgressTracker;
	signal?: AbortSignal;
}

export type NodeHandler = (node: HTMLElement, state: PaginationState, context: HandlerContext) => Promise<boolean>;

const printHandlers: NodeHandler[] = [headingHandler, tableHandler, codeBlockHandler, listHandler];

export const handleSpecialNode = async (
	node: HTMLElement,
	state: PaginationState,
	context: HandlerContext,
): Promise<boolean> => {
	for (const handler of printHandlers) {
		if (await handler(node, state, context)) {
			return true;
		}
	}
	return false;
};
