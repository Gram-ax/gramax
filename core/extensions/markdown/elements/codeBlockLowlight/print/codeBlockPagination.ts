import { HEIGHT_TOLERANCE_PX } from "@ext/print/const";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import { PaginationState } from "@ext/print/utils/pagination/nodeHandlers";
import { YieldFn } from "@ext/markdown/elements/table/print/tablePagination";
import { createPage, getUsableHeight } from "@ext/print/utils/pagination/pageElements";
import { ProgressTracker } from "@ext/print/utils/pagination/progress";

const paginateCodeBlock = async (
	pages: HTMLElement,
	srcPre: HTMLPreElement,
	state: PaginationState,
	nodeDimension: NodeDimensions,
	yieldTick: YieldFn,
	progress: ProgressTracker,
	signal?: AbortSignal,
): Promise<HTMLElement> => {
	const { currentPage } = state;
	throwIfAborted(signal);

	let page = currentPage;
	const preDimension = nodeDimension.get(srcPre);
	const maxHeight = getUsableHeight(page) + HEIGHT_TOLERANCE_PX;

	const srcWrapper = srcPre.querySelector(".child-wrapper");
	if (!srcWrapper) return currentPage;
	const srcWrapperDimension = nodeDimension.get(srcWrapper as HTMLElement);
	const wrapperDimension = NodeDimensions.combineDimensions(preDimension, srcWrapperDimension);

	const codeLines = Array.from(srcWrapper.querySelectorAll(".code-line"));

	let currentPre = srcPre.cloneNode(false) as HTMLPreElement;
	let currentWrapper = srcWrapper.cloneNode(false) as HTMLDivElement;
	currentPre.appendChild(currentWrapper);
	page.appendChild(currentPre);

	let accumulatedHeight =
		state.accumulatedHeight.height +
		Math.max(state.accumulatedHeight.marginBottom, wrapperDimension?.marginTop || 0);
	let currentHeight = (wrapperDimension?.paddingTop || 0) + (wrapperDimension?.paddingBottom || 0);

	for (let i = 0; i < codeLines.length; i++) {
		throwIfAborted(signal);
		const lineElement = codeLines[i];

		const lineDimension = nodeDimension.get(lineElement as HTMLElement);
		const lineHeight = Math.max(lineDimension?.height || 0, wrapperDimension.lineHeight);

		if (accumulatedHeight + currentHeight + lineHeight > maxHeight) {
			if (!currentWrapper.hasChildNodes()) {
				currentPre.remove();
			}

			page = createPage(pages);
			currentPre = srcPre.cloneNode(false) as HTMLPreElement;
			currentWrapper = srcWrapper.cloneNode(false) as HTMLDivElement;
			currentPre.appendChild(currentWrapper);
			page.appendChild(currentPre);

			accumulatedHeight = 0;
			currentHeight = (wrapperDimension?.paddingTop || 0) + (wrapperDimension?.paddingBottom || 0);

			await yieldTick();
			throwIfAborted(signal);
		}

		currentWrapper.appendChild(lineElement.cloneNode(true));
		if (i < codeLines.length - 1) {
			currentWrapper.appendChild(document.createTextNode("\n"));
		}
		currentHeight += lineHeight;
		progress.increase();
	}

	state.accumulatedHeight.height = accumulatedHeight + currentHeight;
	state.accumulatedHeight.marginBottom = wrapperDimension?.marginBottom || 0;

	srcPre.remove();
	return page;
};

export default paginateCodeBlock;
