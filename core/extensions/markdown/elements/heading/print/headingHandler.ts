import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";
import { NodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import { createPage } from "@ext/print/utils/pagination/pageElements";

const headingHandler: NodeHandler = async (node, state, { pages, nodeDimension, progress, signal }) => {
	if (node.tagName !== "H1") return false;
	throwIfAborted(signal);

	if (state.currentPage.childElementCount > 0 || state.fragment.childNodes.length > 0) {
		if (state.fragment.childNodes.length) state.currentPage.appendChild(state.fragment);
		state.currentPage = createPage(pages);
		state.fragment = document.createDocumentFragment();
		state.accumulatedHeight = NodeDimensions.createInitial();
	}
	state.accumulatedHeight = nodeDimension.updateAccumulatedHeight(node, state.accumulatedHeight);
	state.currentPage.appendChild(node);
	progress.increase(1);
	return Promise.resolve(true);
};

export default headingHandler;
