import { WordBlockChild } from "@ext/wordExport/options/WordTypes";
import { Display } from "@ext/properties/models/display";
import { Article } from "@core/FileStructue/Article/Article";
import ViewFilter from "@ext/properties/logic/ViewFilter";
import { viewList } from "@ext/markdown/elements/view/word/viewList";
import { getTableWithGrouping, getTableWithoutGrouping } from "@ext/markdown/elements/view/word/viewTabe";

export const viewWordLayout: WordBlockChild = async ({ tag, wordRenderContext }) => {
	const item = wordRenderContext.parserContext.getArticle();

	const defs = tag.attributes.defs || [];
	const orderby = tag.attributes.orderby || [];
	const groupby = tag.attributes.groupby || [];
	const select = tag.attributes.select || [];
	const display = tag.attributes.display === Display.Kanban ? Display.List : tag.attributes.display;

	const catalogItems = wordRenderContext.catalog.deref.getItems(wordRenderContext.itemsFilter) as Article[];

	const data = await new ViewFilter(
		defs,
		orderby,
		groupby,
		select,
		catalogItems,
		item,
		wordRenderContext.catalog,
		display,
		wordRenderContext.itemsFilter,
	).getFilteredArticles();

	if (display === Display.Table) {
		return groupby
			? [getTableWithGrouping(data, wordRenderContext.titlesMap, groupby)]
			: [getTableWithoutGrouping(data, wordRenderContext.titlesMap)];
	}

	return viewList(data, wordRenderContext.titlesMap);
};
