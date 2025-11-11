import { YieldFn } from "@ext/markdown/elements/table/print/tablePagination";
import { HEIGHT_TOLERANCE_PX } from "@ext/print/const";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import { PaginationState } from "@ext/print/utils/pagination/nodeHandlers";
import { getUsableHeight, createPage } from "@ext/print/utils/pagination/pageElements";
import { ProgressTracker } from "@ext/print/utils/pagination/progress";

const paginateList = async (
	pages: HTMLElement,
	srcList: HTMLOListElement | HTMLUListElement,
	state: PaginationState,
	nodeDimension: NodeDimensions,
	yieldTick: YieldFn,
	progress: ProgressTracker,
	signal?: AbortSignal,
): Promise<HTMLElement> => {
	const { currentPage } = state;
	throwIfAborted(signal);

	let page = currentPage;
	const listDimension = nodeDimension.get(srcList);
	const maxHeight = getUsableHeight(page) + HEIGHT_TOLERANCE_PX;

	const listHeight = listDimension?.height || 0;
	const accumulatedHeight =
		state.accumulatedHeight.height + Math.max(state.accumulatedHeight.marginBottom, listDimension?.marginTop || 0);

	if (accumulatedHeight + listHeight <= maxHeight) {
		state.accumulatedHeight = nodeDimension.updateAccumulatedHeight(srcList, state.accumulatedHeight);
		state.currentPage.appendChild(srcList);
		return page;
	}

	const listItems = Array.from(srcList.querySelectorAll(":scope > li"));

	let currentList = srcList.cloneNode(false) as HTMLOListElement | HTMLUListElement;
	let currentStartNumber = 1;

	page.appendChild(currentList);

	let currentAccumulatedHeight = accumulatedHeight;
	let currentHeight = (listDimension?.paddingTop || 0) + (listDimension?.paddingBottom || 0);

	for (let i = 0; i < listItems.length; i++) {
		throwIfAborted(signal);
		const item = listItems[i];
		const itemDimension = nodeDimension.get(item as HTMLElement);
		const itemHeight = itemDimension?.height || 0;

		if (currentAccumulatedHeight + currentHeight + itemHeight > maxHeight) {
			if (!currentList.hasChildNodes()) {
				currentList.remove();
			}

			page = createPage(pages);
			currentList = srcList.cloneNode(false) as HTMLOListElement | HTMLUListElement;

			if (srcList.tagName === "OL") {
				currentList.style.setProperty("counter-reset", `listitem ${currentStartNumber - 1}`);
			}

			page.appendChild(currentList);

			currentAccumulatedHeight = 0;
			currentHeight = (listDimension?.paddingTop || 0) + (listDimension?.paddingBottom || 0);

			await yieldTick();
			throwIfAborted(signal);
		}

		currentList.appendChild(item.cloneNode(true));
		currentHeight += itemHeight;
		currentStartNumber++;
		progress.increase();
	}

	state.accumulatedHeight.height = currentAccumulatedHeight + currentHeight;
	state.accumulatedHeight.marginBottom = listDimension?.marginBottom || 0;

	srcList.remove();
	return page;
};

export default paginateList;
