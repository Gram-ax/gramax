import { Article } from "@core/FileStructue/Article/Article";
import t from "@ext/localization/locale/translate";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { extractNameAndAnchor } from "@ext/markdown/elements/link/word/link";
import { getViewListContent } from "@ext/markdown/elements/view/pdf/viewList";
import { getTableWithGrouping, getTableWithoutGrouping } from "@ext/markdown/elements/view/pdf/viewTable";
import { BASE_CONFIG, COLOR_CONFIG } from "@ext/pdfExport/config";
import { pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { errorCase } from "@ext/pdfExport/utils/getErrorElement";
import ViewFilter from "@ext/properties/logic/ViewFilter";
import { ViewRenderData } from "@ext/properties/models";
import { Display } from "@ext/properties/models/display";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";
import { Content } from "pdfmake/interfaces";

export async function viewCase(node: Tag, context: pdfRenderContext): Promise<Content> {
	const item = context.parserContext.getArticle();

	const defs = node.attributes.defs || [];
	const orderby = node.attributes.orderby || [];
	const groupby = node.attributes.groupby || [];
	const select = node.attributes.select || [];
	const display = node.attributes.display === Display.Kanban ? Display.List : node.attributes.display;

	const data = await new ViewFilter(
		defs,
		orderby,
		groupby,
		select,
		context.catalog.deref.getItems(context.itemFilters) as Article[],
		item,
		context.catalog,
		display,
		context.itemFilters,
		null,
		null,
		null,
	).getFilteredArticles();

	if (!data || data.length === 0) {
		return errorCase();
	}

	if (display === Display.Table) {
		const hasGrouping = data.length > 1;
		return hasGrouping ? getTableWithGrouping(data, context, groupby) : getTableWithoutGrouping(data[0], context);
	}

	return getViewListContent(data, context);
}

export const getViewArticleItem = (
	article: ViewRenderData,
	context: pdfRenderContext,
	isList: boolean = false,
): Content => {
	const { title, order, anchor } = extractNameAndAnchor({ href: article.linkPath, hash: "" }, context.titlesMap);
	const safeTitle = article.title ? article.title : t("article.no-name");
	const linkToDestination = title ? generateBookmarkName(order, title, anchor) : undefined;

	return {
		text: safeTitle,
		...(linkToDestination ? { linkToDestination, color: COLOR_CONFIG.link } : {}),
		...(isList ? { margin: [0, BASE_CONFIG.FONT_SIZE * 0.5, 0, 0] } : {}),
	};
};
