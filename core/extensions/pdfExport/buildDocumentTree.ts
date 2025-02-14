import { Article } from "@core/FileStructue/Article/Article";
import { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { Item } from "@core/FileStructue/Item/Item";
import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import Context from "@core/Context/Context";
import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import ResourceManager from "@core/Resource/ResourceManager";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import MarkdownElementsFilter from "@ext/wordExport/MarkdownElementsFilter";

interface BuildDocumentTreeParams {
	isCategory: boolean;
	isCatalog: boolean;
	item: Item;
	pdfExportedKeys: Set<string>;
	catalog: ReadonlyCatalog;
	ctx: Context;
	parser: MarkdownParser;
	parserContextFactory: ParserContextFactory;
	filters: ItemFilter[];
	titlesMap: Map<string, TitleInfo>;
}

export interface TitleInfo {
	title: string;
}

export interface DocumentTree {
	name: string;
	content: RenderableTreeNode;
	resourceManager: ResourceManager;
	parserContext: ParserContext;
	children: DocumentTree[];
}

const buildDocumentTree = async (params: BuildDocumentTreeParams): Promise<DocumentTree> => {
	const {
		isCategory,
		isCatalog,
		item,
		pdfExportedKeys,
		catalog,
		ctx,
		parser,
		parserContextFactory,
		filters,
		titlesMap,
	} = params;

	const filter = new MarkdownElementsFilter(pdfExportedKeys);

	const heading: DocumentTree = {
		name: isCatalog ? catalog.props.title : item.getTitle() || catalog.name,
		content: !isCatalog ? filter.getSupportedTree((item as Article).parsedContent?.renderTree) : "",
		resourceManager: !isCatalog ? (item as Article).parsedContent?.resourceManager : null,
		parserContext: !isCatalog
			? parserContextFactory.fromArticle(item as Article, catalog, defaultLanguage, true)
			: null,
		children: [],
	};

	const fileName = item.getFileName();

	if (fileName) titlesMap.set(fileName, { title: heading.name });

	if (!isCategory && !isCatalog) return heading;

	if (item.type === ItemType.category) {
		const filteredItems = (item as Category).getFilteredItems(filters, catalog) || [];

		heading.children = await Promise.all(
			filteredItems.map(async (subItem) => {
				return await buildDocumentTree({
					isCategory: subItem.type === ItemType.category,
					isCatalog: false,
					item: subItem,
					pdfExportedKeys,
					catalog,
					ctx,
					parser,
					parserContextFactory,
					filters,
					titlesMap,
				});
			}),
		);
	}

	return heading;
};

export default buildDocumentTree;
