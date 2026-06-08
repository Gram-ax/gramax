import { FragmentPaginator } from "@ext/markdown/elements/fragment/print/FragmentPaginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import type { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import Paginator from "@ext/print/utils/pagination/Paginator";

const fragmentHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	if (node.dataset?.component !== "fragment") return false;

	const fragmentPaginator = new FragmentPaginator(node as HTMLDivElement, paginator);
	await fragmentPaginator.paginateNode();
	await Paginator.controlInfo.yieldTick();
	throwIfAborted(Paginator.controlInfo.signal);
	return true;
};

const fragmentHandler: PrintNodeHandler = {
	handle: fragmentHandlerFn,
};

export default fragmentHandler;
