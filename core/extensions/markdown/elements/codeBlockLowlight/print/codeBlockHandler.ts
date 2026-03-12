import type { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import CodeBlockPaginator from "./CodeBlockPagination";

const codeBlockHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	if (node.tagName !== "PRE") return false;
	const codeBlockPaginator = new CodeBlockPaginator(node as HTMLPreElement, paginator);
	await codeBlockPaginator.paginateNode();
	return true;
};

const codeBlockHandler: PrintNodeHandler = {
	handle: codeBlockHandlerFn,
};

export default codeBlockHandler;
