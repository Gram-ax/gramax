import { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import { TablePaginator } from "./TablePaginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import Paginator from "@ext/print/utils/pagination/Paginator";

const tableHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	if (node.dataset?.component !== "table") return false;

	const tablePaginator = new TablePaginator(node as HTMLDivElement, paginator);
	await tablePaginator.paginateNode();
	await Paginator.controlInfo.yieldTick();
	throwIfAborted(Paginator.controlInfo.signal);
	return true;
};

const tableHandler: PrintNodeHandler = {
	isRequired: true,
	handle: tableHandlerFn,
};

export default tableHandler;
