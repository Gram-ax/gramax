import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import Paginator from "@ext/print/utils/pagination/Paginator";
import { NotePaginator } from "./NotePaginator";

const noteHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	if (!node.classList.contains("admonition")) return false;

	const notePaginator = new NotePaginator(node as HTMLDivElement, paginator);
	await notePaginator.paginateNode();

	await Paginator.controlInfo.yieldTick();
	throwIfAborted(Paginator.controlInfo.signal);
	return true;
};

const noteHandler: PrintNodeHandler = {
	handle: noteHandlerFn,
};

export default noteHandler;
