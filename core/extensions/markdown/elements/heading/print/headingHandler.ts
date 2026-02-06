import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import type { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import PagePaginator from "@ext/print/utils/pagination/PagePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";

const articleHeaderHandler = (node: HTMLHeadingElement, paginator: Paginator) => {
	const { currentContainer } = paginator;
	throwIfAborted(Paginator.controlInfo.signal);

	if (currentContainer.childElementCount > 0 || currentContainer.childNodes.length > 0) {
		paginator.headingElements = [];
		paginator.createPage();
	}
	Paginator.paginationInfo.accumulatedHeight = Paginator.paginationInfo.nodeDimension.updateAccumulatedHeightNode(
		node,
		Paginator.paginationInfo.accumulatedHeight,
	);
	paginator.currentContainer.appendChild(node);
};

const headingInArticleHandler = (heading: HTMLHeadingElement, paginator: Paginator) => {
	const lenght = paginator.headingElements.length;
	if (lenght) {
		const last = paginator.headingElements[lenght - 1];
		const lastLevel = parseInt(last.tagName[1]);
		const currentLevel = parseInt(heading.tagName[1]);

		if (currentLevel <= lastLevel) paginator.headingElements = [];
	}

	const { isNewPage, tryFit } = paginator.processNodeForPage(heading);
	if (tryFit) return;

	!isNewPage && paginator.createPage();
	paginator.tryFitElement(heading, true);
};

const headingHandlerFn: PrintNodeHandler["handle"] = (node, paginator) => {
	if (!(node instanceof HTMLHeadingElement)) return false;
	headingInArticleHandler(node, paginator);
	paginator.headingElements.push(node);
	return true;
};

const headingHandler: PrintNodeHandler = {
	isRequired: true,
	handle: headingHandlerFn,
};

export default headingHandler;
