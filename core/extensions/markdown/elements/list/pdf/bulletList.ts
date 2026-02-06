import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { listItemHandler } from "@ext/markdown/elements/list/pdf/listItem";
import { BASE_CONFIG, ICON_SIZE } from "@ext/pdfExport/config";
import { NodeOptions, pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { getSvgIconFromString } from "@ext/pdfExport/utils/getIcon";
import { isTag } from "@ext/pdfExport/utils/isTag";
import { JSONContent } from "@tiptap/core";
import { Content } from "pdfmake/interfaces";

export const bulletListHandler = async (
	node: Tag | JSONContent,
	context: pdfRenderContext,
	options: NodeOptions,
): Promise<Content> => {
	const children = "children" in node ? node.children || [] : node.content || [];
	const level = options?.level || 0;

	const listItems = await Promise.all(
		children.map(async (taskItem, index) => {
			if (!isTag(taskItem) && !("type" in taskItem)) return null;
			const isTaskItem = "attributes" in taskItem ? taskItem.attributes?.isTaskItem : taskItem.attrs?.isTaskItem;
			const itemContent = await listItemHandler(taskItem, context, { ...options, level: level + 1 }, index === 0);

			if (!isTaskItem) {
				return itemContent;
			}

			const isChecked = "attributes" in taskItem ? taskItem.attributes?.checked : taskItem.attrs?.checked;
			const iconPath = await getSvgIconFromString(isChecked ? "square-check-big" : "square");

			return {
				columns: [
					{
						svg: iconPath,
						width: ICON_SIZE,
						height: ICON_SIZE,
						margin: [0, 2, 0, 0],
						alignment: "left",
					},
					{ stack: itemContent.stack, width: "*" },
				],
				columnGap: 5,
				margin: [0, BASE_CONFIG.FONT_SIZE * 0.25, 0, BASE_CONFIG.FONT_SIZE * 0.25],
			} as Content;
		}),
	);

	const marginTop = level ? -4 : 0;

	const isTaskList = children.some((item) => isTag(item) && item.attributes?.isTaskItem);
	return isTaskList
		? ({ stack: listItems.filter(Boolean), margin: [0, marginTop, 0, 0] } as Content)
		: ({ ul: listItems.filter(Boolean), margin: [1, marginTop, 0, 0] } as Content);
};
