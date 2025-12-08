import type { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import Paginator from "@ext/print/utils/pagination/Paginator";
import PagePaginator from "@ext/print/utils/pagination/PagePaginator";

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

	if (paginator.tryFitElement(heading)) return paginator.headingElements.push(heading);

	paginator.createPage();
	paginator.tryFitElement(heading);
};

const headingHandlerFn: PrintNodeHandler["handle"] = (node, paginator) => {
	if (!(node instanceof HTMLHeadingElement)) return false;
	if (node.tagName === "H1" && paginator instanceof PagePaginator) articleHeaderHandler(node, paginator);
	else headingInArticleHandler(node, paginator);
	return true;
};

const headingHandler: PrintNodeHandler = {
	isRequired: true,
	handle: headingHandlerFn,
};

export default headingHandler;
