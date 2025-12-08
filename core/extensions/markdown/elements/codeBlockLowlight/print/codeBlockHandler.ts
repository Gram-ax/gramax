import { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import paginateCodeBlock from "./codeBlockPagination";

const codeBlockHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	if (node.tagName !== "PRE") return false;
	return await paginateCodeBlock(node as HTMLPreElement, paginator);
};

const codeBlockHandler: PrintNodeHandler = {
	handle: codeBlockHandlerFn,
};

export default codeBlockHandler;
