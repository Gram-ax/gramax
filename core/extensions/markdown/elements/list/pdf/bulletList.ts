import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { listItemHandler } from "@ext/markdown/elements/list/pdf/listItem";
import { getSvgIconFromString } from "@ext/pdfExport/utils/getIcon";
import { BASE_CONFIG, ICON_SIZE } from "@ext/pdfExport/config";
import { Content } from "pdfmake/interfaces";
import { isTag } from "@ext/pdfExport/utils/isTag";

export const bulletListHandler = async (node: Tag, level = 0): Promise<Content> => {
	const content = node.children || [];
	const listItems = await Promise.all(
		content.map(async (taskItem, index) => {
			if (!isTag(taskItem)) return null;

			const isTaskItem = taskItem.attributes?.isTaskItem;
			const itemContent = await listItemHandler(taskItem, level + 1, index === 0);

			if (!isTaskItem) {
				return itemContent;
			}

			const isChecked = taskItem.attributes?.checked || false;
			const iconPath = getSvgIconFromString(isChecked ? "square-check-big" : "square");

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

	const isTaskList = content.some((item) => isTag(item) && item.attributes?.isTaskItem);
	return isTaskList
		? ({ stack: listItems.filter(Boolean), margin: [0, marginTop, 0, 0] } as Content)
		: ({ ul: listItems.filter(Boolean), margin: [1, marginTop, 0, 0] } as Content);
};
