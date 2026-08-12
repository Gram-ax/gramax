import OpenApiPaginator, { OpenApiSectionPaginator } from "@ext/markdown/elements/openApi/print/OpenApiPaginator";
import waitForOpenApiBlocks from "@ext/markdown/elements/openApi/print/waitForOpenApiBlocks";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import type { PrintNodeHandler } from "@ext/print/utils/pagination/nodeHandlers";
import Paginator from "@ext/print/utils/pagination/Paginator";

/** A section met one level down while the block is being split: operation cards, or schema cards. */
const stackOf = (node: HTMLElement): HTMLElement | null => {
	if (node.tagName === "API-SECTION") return node.querySelector<HTMLElement>(".operation-stack");
	if (node.tagName === "API-MODELS") return node.querySelector<HTMLElement>(".models-stack");
	return null;
};

/**
 * Two shapes, one handler: the OpenAPI block as a top-level article node, and a section met one level down
 * while that block is being split. Both are lists inside repeatable chrome — see OpenApiPaginator.
 */
const openApiHandlerFn: PrintNodeHandler["handle"] = async (node, paginator) => {
	const stack = OpenApiPaginator.contentHost(node) ?? stackOf(node);
	if (!stack) return false;

	const blockPaginator = OpenApiPaginator.contentHost(node)
		? new OpenApiPaginator(node, paginator)
		: new OpenApiSectionPaginator(node, stack, paginator);
	await blockPaginator.paginateNode();

	await Paginator.controlInfo.yieldTick();
	throwIfAborted(Paginator.controlInfo.signal);
	return true;
};

const openApiHandler: PrintNodeHandler = {
	handle: openApiHandlerFn,
	waitForReady: waitForOpenApiBlocks,
};

export default openApiHandler;
