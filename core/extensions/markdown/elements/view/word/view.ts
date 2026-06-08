import type { Article } from "@core/FileStructue/Article/Article";
import { viewList } from "@ext/markdown/elements/view/word/viewList";
import { getTableWithGrouping, getTableWithoutGrouping } from "@ext/markdown/elements/view/word/viewTabe";
import ViewFilter from "@ext/properties/logic/ViewFilter";
import { Display } from "@ext/properties/models/display";
import type { WordBlockChild } from "@ext/wordExport/options/WordTypes";

export const viewWordLayout: WordBlockChild = async ({ tag, wordRenderContext }) => {
	const item = wordRenderContext.parserContext.getArticle();
	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;

	const defs = attrs.defs || [];
	const orderby = attrs.orderby || [];
	const groupby = attrs.groupby || [];
	const select = attrs.select || [];
	const display = attrs.display === Display.Kanban ? Display.List : attrs.display;

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
		null,
		null,
		null,
	).getFilteredArticles();

	if (display === Display.Table) {
		return groupby
			? [await getTableWithGrouping(data, wordRenderContext.titlesMap, groupby)]
			: [await getTableWithoutGrouping(data, wordRenderContext.titlesMap)];
	}

	return viewList(data, wordRenderContext.titlesMap);
};
