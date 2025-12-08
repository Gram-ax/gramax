import { TabsPaginator } from "@ext/markdown/elements/tabs/print/TabsPaginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import Paginator from "@ext/print/utils/pagination/Paginator";

const tabsHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	if (node.dataset?.component !== "tabs") return false;

	const tabsPaginator = new TabsPaginator(node as HTMLDivElement, paginator);
	await tabsPaginator.paginateNode();
	await Paginator.controlInfo.yieldTick();
	throwIfAborted(Paginator.controlInfo.signal);
	return true;
};

const tabsHandler: PrintNodeHandler = {
	handle: tabsHandlerFn,
};

export default tabsHandler;
