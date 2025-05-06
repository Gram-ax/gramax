import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { listItemHandler } from "@ext/markdown/elements/list/pdf/listItem";
import { BASE_CONFIG, FONT_SIZE_COEFFICIENT } from "@ext/pdfExport/config";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { ContentOrderedList } from "pdfmake/interfaces";
import { JSONContent } from "@tiptap/core";

export const orderedListHandler = async (
	node: Tag | JSONContent,
	context: pdfRenderContext,
	options: NodeOptions,
): Promise<ContentOrderedList> => {
	const children = "children" in node ? node.children || [] : node.content || [];
	const level = options?.level || 0;

	const listItems = await Promise.all(
		children.map(async (item, index) => {
			if (!isTag(item) && !("type" in item)) return null;
			return listItemHandler(item, context, { ...options, level: level + 1 }, index === 0);
		}),
	);

	const marginLeft = level === 0 ? 0 : BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT;
	const marginTop = level === 0 ? 0 : -4;

	const filteredListItems = listItems.filter(Boolean);

	return { ol: filteredListItems, margin: [marginLeft, marginTop, 0, 0] };
};
