import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { Catalog, ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { Category } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import MarkdownElementsFilter from "@ext/wordExport/MarkdownElementsFilter";
import { DocumentTree } from "./DocumentTree";

const buildDocumentTree = async (
	isCategory: boolean,
	isCatalog: boolean,
	item: Item,
	exportedKeys: Set<string>,
	catalog: Catalog,
	ctx: Context,
	parser: MarkdownParser,
	parserContextFactory: ParserContextFactory,
	filters: ItemFilter[],
	level: number = 0,
	number: string = "",
) => {
	const filter = new MarkdownElementsFilter(exportedKeys);

	if (!isCatalog) await parseContent(item as Article, catalog, ctx, parser, parserContextFactory, false);

	const heading: DocumentTree = {
		name: isCatalog ? catalog.props.title : item.getTitle() || catalog.getName(),
		content: !isCatalog ? filter.getSupportedTree((item as Article).parsedContent?.renderTree) : "",
		resourceManager: !isCatalog ? (item as Article).parsedContent?.resourceManager : undefined,
		level: level,
		number: number,
		parserContext: !isCatalog
			? parserContextFactory.fromArticle(item as Article, catalog, defaultLanguage, true)
			: null,
		children: [],
	};

	if (!isCategory && !isCatalog) return heading;

	if (item.type === ItemType.category) {
		heading.children = await Promise.all(
			(item as Category).getFilteredItems(filters, catalog)?.map(async (subItem, index) => {
				return await buildDocumentTree(
					isCategory || isCatalog,
					false,
					subItem as Category,
					exportedKeys,
					catalog,
					ctx,
					parser,
					parserContextFactory,
					filters,
					level + 1,
					`${number}${index + 1}.`,
				);
			}) || [],
		);
	} else heading.children = [];

	return heading;
};

export default buildDocumentTree;
