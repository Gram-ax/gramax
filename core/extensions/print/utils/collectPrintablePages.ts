import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { Category } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { PrintablePage } from "@ext/print/types";

async function collectPrintablePages(
	item: Item,
	catalog: ReadonlyCatalog,
	ctx: Context,
	filters: ItemFilter[],
	parser: MarkdownParser,
	parserContextFactory: ParserContextFactory,
	pages: PrintablePage[],
	isCategory: boolean,
	isCatalog: boolean,
) {
	if (isCatalog) isCategory = true;
	const itemVisible = filters.every((filter) => filter(item, catalog));
	if (!itemVisible) return;

	try {
		await parseContent(item as Article, catalog, ctx, parser, parserContextFactory);
		const parsedData = await (item as Article).parsedContent.read((p) => ({
			content: p?.renderTree,
			resourceManager: p?.resourceManager,
			itemRefPath: item.ref.path.value,
		}));

		pages.push({
			title: item.getTitle() || item.getFileName(),
			content: parsedData.content,
			resources: parsedData.resourceManager,
			itemRefPath: parsedData.itemRefPath,
		});
	} catch (error) {
		console.error(`Error parsing content for ${item.ref.path}:`, error);
	}

	if (item.type === ItemType.category && isCategory) {
		const children = (item as Category).getFilteredItems(filters, catalog) || [];
		for (const child of children) {
			await collectPrintablePages(
				child,
				catalog,
				ctx,
				filters,
				parser,
				parserContextFactory,
				pages,
				isCategory,
				isCatalog,
			);
		}
	}
}

export default collectPrintablePages;
