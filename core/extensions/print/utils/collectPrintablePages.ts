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
	setTitleNumber?: boolean,
	isFirstLevel = true,
	titleNumber = "1",
	itemLevel = 1,
) {
	if (isCatalog) isCategory = true;
	const itemVisible = filters.every((filter) => filter(item, catalog));
	if (!itemVisible) return;

	const isRootCategory = isCatalog && isFirstLevel;
	try {
		if (!isRootCategory) {
			const title = item.getTitle() || item.getFileName();
			await parseContent(item as Article, catalog, ctx, parser, parserContextFactory);
			const parsedData = await (item as Article).parsedContent.read((p) => ({
				content: p?.renderTree,
				resourceManager: p?.resourceManager,
				itemRefPath: item.ref.path.value,
				logicPath: item.logicPath,
			}));

			pages.push({
				level: itemLevel,
				title: setTitleNumber ? `${titleNumber}. ${title}` : title,
				content: parsedData.content,
				resources: parsedData.resourceManager,
				itemRefPath: parsedData.itemRefPath,
				logicPath: parsedData.logicPath,
			});
		}
	} catch (error) {
		console.error(`Error parsing content for ${item.ref.path}:`, error);
	}

	if (item.type === ItemType.category && isCategory) {
		const children = (item as Category).getFilteredItems(filters, catalog) || [];

		let idx = !isRootCategory ? 1 : 0;
		for (const child of children) {
			const childNumber = isFirstLevel ? `${idx + 1}` : `${titleNumber}.${idx}`;
			const childLevel = isFirstLevel ? 1 : itemLevel + 1;
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
				setTitleNumber,
				false,
				childNumber,
				childLevel,
			);
			idx++;
		}
	}
}

export default collectPrintablePages;
