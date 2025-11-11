import { paginateTable } from "@ext/markdown/elements/table/print/tablePagination";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { NodeHandler } from "@ext/print/utils/pagination/nodeHandlers";

const tableHandler: NodeHandler = async (node, state, { pages, nodeDimension, yieldTick, progress, signal }) => {
	if (node.tagName !== "TABLE") return false;
	throwIfAborted(signal);

	if (state.fragment.childNodes.length) {
		state.currentPage.appendChild(state.fragment);
		state.fragment = document.createDocumentFragment();
		await yieldTick();
		throwIfAborted(signal);
	}

	state.currentPage = await paginateTable(
		pages,
		node as HTMLTableElement,
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

export default tableHandler;
