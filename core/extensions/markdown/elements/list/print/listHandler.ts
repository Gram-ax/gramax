import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import { ListPaginator } from "./ListPaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";

const listHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	if (node.tagName !== "UL" && node.tagName !== "OL") return false;

	const listPaginator = new ListPaginator(node as HTMLOListElement | HTMLUListElement, paginator);
	await listPaginator.paginateNode();
	await Paginator.controlInfo.yieldTick();
	throwIfAborted(Paginator.controlInfo.signal);
	return true;
};

const listHandler: PrintNodeHandler = {
	handle: listHandlerFn,
};

export default listHandler;
