import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import type { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import Paginator from "@ext/print/utils/pagination/Paginator";
import ParagraphPaginator from "./ParagraphPaginator";

const paragraphHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	if (node.tagName !== "P") return false;

	const paragraphPaginator = new ParagraphPaginator(node as HTMLParagraphElement, paginator);
	await paragraphPaginator.paginateNode();
	await Paginator.controlInfo.yieldTick();
	throwIfAborted(Paginator.controlInfo.signal);
	return true;
};

const paragraphHandler: PrintNodeHandler = {
	handle: paragraphHandlerFn,
};

export default paragraphHandler;
