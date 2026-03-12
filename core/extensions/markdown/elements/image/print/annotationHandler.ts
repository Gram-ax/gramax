import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import type { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import Paginator from "@ext/print/utils/pagination/Paginator";
import AnnotationPaginator from "./AnnotationPaginator";

const annotationListHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	if (node.dataset?.component !== "annotation-list") return false;

	const containerListPaginator = new AnnotationPaginator(node as HTMLDivElement, paginator);
	await containerListPaginator.paginateNode();
	await Paginator.controlInfo.yieldTick();
	throwIfAborted(Paginator.controlInfo.signal);
	return true;
};

const annotationListHandler: PrintNodeHandler = {
	handle: annotationListHandlerFn,
};

export default annotationListHandler;
