import { SnippetPaginator } from "@ext/markdown/elements/snippet/print/SnippetPaginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import Paginator from "@ext/print/utils/pagination/Paginator";

const snippetHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	if (node.dataset?.component !== "snippet") return false;

	const snippetPaginator = new SnippetPaginator(node as HTMLDivElement, paginator);
	await snippetPaginator.paginateNode();
	await Paginator.controlInfo.yieldTick();
	throwIfAborted(Paginator.controlInfo.signal);
	return true;
};

const snippetHandler: PrintNodeHandler = {
	handle: snippetHandlerFn,
};

export default snippetHandler;
