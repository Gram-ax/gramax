import { STANDARD_PAGE_WIDTH } from "@ext/wordExport/options/wordExportSettings";
import { LIST_HANGING_MM, LIST_LEFT_INDENT_MM, LIST_GAP_MM_DEFAULT, getMmToTw } from "./consts";

export type WrapperMetrics = {
	indent: number; // indent of the whole wrapper (tblInd), twips
	leftCellWidth: number; // width of the left cell (hanging+gap), twips
	rightCellWidth: number;
	totalWidth: number;
};

export interface CalcWrapperMetricsParams {
	level: number;
	availableTw?: number;
	hangingMm?: number;
	gapMm?: number;
	leftIndentMmFn?: (lvl: number) => number;
}

export async function calcWrapperMetrics({
	level,
	availableTw = STANDARD_PAGE_WIDTH,
	hangingMm = LIST_HANGING_MM,
	gapMm = LIST_GAP_MM_DEFAULT,
	leftIndentMmFn = LIST_LEFT_INDENT_MM,
}: CalcWrapperMetricsParams): Promise<WrapperMetrics> {
	const mmToTw = await getMmToTw();
	const leftText = mmToTw(leftIndentMmFn(level));
	const leftCell = mmToTw(hangingMm + gapMm);
	const indent = Math.max(leftText - leftCell, 0);
	const right = Math.max(availableTw - leftCell, mmToTw(10));
	return {
		indent,
		leftCellWidth: leftCell,
		rightCellWidth: right,
		totalWidth: leftCell + right,
	};
}
