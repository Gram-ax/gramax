import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { listItemHandler } from "@ext/markdown/elements/list/pdf/listItem";
import { BASE_CONFIG, FONT_SIZE_COEFFICIENT } from "@ext/pdfExport/config";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { ContentOrderedList } from "pdfmake/interfaces";

export const orderedListHandler = async (
	node: Tag,
	context: pdfRenderContext,
	options: NodeOptions,
): Promise<ContentOrderedList> => {
	const content = node.children || [];
	const level = options?.level || 0;

	const listItems = await Promise.all(
		content.map(async (item, index) => {
			if (!isTag(item)) return null;
			return listItemHandler(item, context, { ...options, level: level + 1 }, index === 0);
		}),
	);

	const marginLeft = level === 0 ? 0 : BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT;
	const marginTop = level === 0 ? 0 : -4;

	const filteredListItems = listItems.filter(Boolean);

	return { ol: filteredListItems, margin: [marginLeft, marginTop, 0, 0] };
};
