import t from "@ext/localization/locale/translate";
import { getViewArticleItem } from "@ext/markdown/elements/view/pdf/view";
import { BASE_CONFIG } from "@ext/pdfExport/config";
import { pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { ViewRenderGroup } from "@ext/properties/models";
import { Content } from "pdfmake/interfaces";

export const getViewListContent = (data: ViewRenderGroup[], context: pdfRenderContext): Content => {
	const content = data.map((group) => processListGroup(group, context));
	return {
		stack: content,
		margin: [2, 0, 0, 0],
	};
};

const processListGroup = (group: ViewRenderGroup, context: pdfRenderContext, level: number = 0): Content => {
	const items: Content[] = [];

	if (group.group && group.group.length > 0) {
		const groupTitle = getGroupTitle(group);
		if (groupTitle.length > 0) {
			items.push({
				text: groupTitle,
				margin: [0, BASE_CONFIG.FONT_SIZE * 0.5, 0, 0],
			});
		}
	}

	if (group.articles?.length > 0) {
		group.articles.forEach((article) => items.push(getViewArticleItem(article, context, true)));
	}

	if (group.subgroups?.length > 0) {
		group.subgroups.forEach((subgroup) => items.push(processListGroup(subgroup, context, level + 1)));
	}

	return {
		ul: items,
		margin: [BASE_CONFIG.FONT_SIZE * 0.25 * level, 0, 0, 0],
	};
};

const getGroupTitle = (group: ViewRenderGroup): string[] => {
	if (!group.group) {
		return [t("properties.empty")];
	}
	return group.group.map((g: string | null) => (g === null ? t("properties.empty") : g));
};
