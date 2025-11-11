import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { NodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import paginateCodeBlock from "./codeBlockPagination";

const codeBlockHandler: NodeHandler = async (node, state, { pages, nodeDimension, yieldTick, progress, signal }) => {
	if (node.tagName !== "PRE") return false;
	throwIfAborted(signal);
	if (state.fragment.childNodes.length) {
		state.currentPage.appendChild(state.fragment);
		state.fragment = document.createDocumentFragment();
		await yieldTick();
		throwIfAborted(signal);
	}
	state.currentPage = await paginateCodeBlock(
		pages,
		node as HTMLPreElement,
		state,
		nodeDimension,
		yieldTick,
		progress,
		signal,
	);
	progress.increase(1);
	await yieldTick();
	throwIfAborted(signal);
	return true;
};

export default codeBlockHandler;
