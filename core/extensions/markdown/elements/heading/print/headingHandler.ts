import type { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import type Paginator from "@ext/print/utils/pagination/Paginator";

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
