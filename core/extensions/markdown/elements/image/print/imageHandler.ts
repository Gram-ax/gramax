import type { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import Paginator from "@ext/print/utils/pagination/Paginator";
import ImagePaginator from "./ImagePaginator";

const imageHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	if (node.dataset?.component !== "image" && node.dataset?.component !== "diagram") return false;

	const imagePaginator = new ImagePaginator(node as HTMLDivElement, paginator);
	await imagePaginator.paginateNode();
	await Paginator.controlInfo.yieldTick();

	return true;
};

const imageHandler: PrintNodeHandler = {
	handle: imageHandlerFn,
};

export default imageHandler;
