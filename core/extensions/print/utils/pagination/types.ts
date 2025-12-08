import type { AccumulatedHeight, NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import { PrintHandlerGroups } from "@ext/print/utils/pagination/nodeHandlers";
import type { ProgressTracker } from "@ext/print/utils/pagination/progress";

type YieldFn = (force?: boolean) => Promise<void>;

export interface PrintPageInfo {
	pages?: HTMLElement;
	usablePageHeight?: number;
	usablePageWidth?: number;
}

export interface ControlInfo {
	yieldTick: YieldFn;
	progress: ProgressTracker;
	signal?: AbortSignal;
}

export interface PaginationInfo {
	printHandlers: PrintHandlerGroups;
	nodeDimension: NodeDimensions;
	accumulatedHeight: AccumulatedHeight;
}
