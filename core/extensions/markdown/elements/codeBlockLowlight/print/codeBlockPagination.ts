import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import Paginator from "@ext/print/utils/pagination/Paginator";

const paginateCodeBlock = async (srcPre: HTMLPreElement, paginator: Paginator): Promise<boolean> => {
	let pageContainer = paginator.currentContainer;
	throwIfAborted(Paginator.controlInfo.signal);

	const preDimension = Paginator.paginationInfo.nodeDimension.get(srcPre);
	const maxHeight = paginator.getUsableHeight();

	const srcWrapper = srcPre.querySelector(".child-wrapper");
	if (!srcWrapper) return false;
	const srcWrapperDimension = Paginator.paginationInfo.nodeDimension.get(srcWrapper as HTMLElement);
	const wrapperDimension = NodeDimensions.combineDimensions(preDimension, srcWrapperDimension);

	const codeLines = Array.from(srcWrapper.querySelectorAll(".code-line"));

	let currentPre = srcPre.cloneNode(false) as HTMLPreElement;
	let currentWrapper = srcWrapper.cloneNode(false) as HTMLDivElement;
	currentPre.appendChild(currentWrapper);
	pageContainer.appendChild(currentPre);

	let accumulatedHeight =
		Paginator.paginationInfo.accumulatedHeight.height +
		Math.max(Paginator.paginationInfo.accumulatedHeight.marginBottom, wrapperDimension?.marginTop || 0);
	let currentHeight = wrapperDimension?.paddingH + wrapperDimension.marginBottom;

	for (let i = 0; i < codeLines.length; i++) {
		throwIfAborted(Paginator.controlInfo.signal);
		const lineElement = codeLines[i];

		const lineDimension = Paginator.paginationInfo.nodeDimension.get(lineElement as HTMLElement);
		const height = Math.ceil(lineDimension?.height / wrapperDimension.lineHeight) * wrapperDimension.lineHeight;

		if (accumulatedHeight + currentHeight + height > maxHeight) {
			if (!currentWrapper.hasChildNodes()) {
				currentPre.remove();
			}

			pageContainer = paginator.createPage();
			currentPre = srcPre.cloneNode(false) as HTMLPreElement;
			currentWrapper = srcWrapper.cloneNode(false) as HTMLDivElement;
			currentPre.appendChild(currentWrapper);
			pageContainer.appendChild(currentPre);

			accumulatedHeight = Paginator.paginationInfo.accumulatedHeight.height + wrapperDimension?.marginTop;
			currentHeight = wrapperDimension?.paddingH + wrapperDimension.marginBottom;

			await Paginator.controlInfo.yieldTick();
			throwIfAborted(Paginator.controlInfo.signal);
		}

		currentWrapper.appendChild(lineElement.cloneNode(true));
		if (i < codeLines.length - 1) {
			currentWrapper.appendChild(document.createTextNode("\n"));
		}
		currentHeight += height;
	}

	Paginator.paginationInfo.accumulatedHeight.height = accumulatedHeight + currentHeight;
	Paginator.paginationInfo.accumulatedHeight.marginBottom = wrapperDimension?.marginBottom || 0;

	srcPre.remove();
	return true;
};

export default paginateCodeBlock;
