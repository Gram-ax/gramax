import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import type { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import Paginator from "@ext/print/utils/pagination/Paginator";
import ContainerListPaginator from "../../list/print/ContainerListPaginator";

const viewHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	if (node.dataset?.component !== "view") return false;

	const containerListPaginator = new ContainerListPaginator(node as HTMLDivElement, paginator);
	await containerListPaginator.paginateNode();
	await Paginator.controlInfo.yieldTick();
	throwIfAborted(Paginator.controlInfo.signal);
	return true;
};

const viewHandler: PrintNodeHandler = {
	handle: viewHandlerFn,
};

export default viewHandler;
