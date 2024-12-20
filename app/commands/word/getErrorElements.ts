import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { Category } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import UnsupportedElements from "@ext/import/model/UnsupportedElements";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import MarkdownElementsFilter from "@ext/wordExport/MarkdownElementsFilter";
import { exportedKeys } from "@ext/wordExport/layouts";
import { Command } from "../../types/Command";
import { tString } from "@ext/localization/locale/translate";
import RuleProvider from "@ext/rules/RuleProvider";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";

const getErrorElements: Command<
	{ ctx: Context; itemPath: Path; isCategory: boolean; catalogName: string },
	UnsupportedElements[]
> = Command.create({
	path: "word/getErrorElements",
	kind: ResponseKind.json,

	async do({ ctx, catalogName, itemPath, isCategory }) {
		const { wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();
		const itemFilters = new RuleProvider(ctx).getItemFilters();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		const markdownElementsFilter = new MarkdownElementsFilter(exportedKeys);
		const unsupportedElements: UnsupportedElements[] = [];
		const isCatalog = itemPath.toString() === "";

		const collectUnsupportedElements = async (item: Item) => {
			await parseContent(item as Article, catalog, ctx, parser, parserContextFactory);

			const article = {
				id: item.order.toString(),
				title: item.getTitle(),
				link: await catalog.getPathname(item),
			};

			const elements = markdownElementsFilter.getUnsupportedElements(
				(item as Article).parsedContent.renderTree as Tag,
			);
			if (elements.size > 0)
				unsupportedElements.push({
					article,
					elements: Array.from(elements, ([name, count]) => ({
						name: tString(name),
						count,
					})),
				});

			if (item instanceof Category && (isCategory || isCatalog))
				await Promise.all(item.getFilteredItems(itemFilters, catalog).map(collectUnsupportedElements));
		};

		const getItemsToProcess = () => {
			if (isCategory) {
				const finishedItem = catalog.findItemByItemPath<Category>(itemPath);
				return finishedItem ? [finishedItem] : [];
			}
			if (isCatalog) {
				const rootCategory = resolveRootCategory(catalog, catalog.props, ctx.contentLanguage);
				return rootCategory instanceof Category ? rootCategory.getFilteredItems(itemFilters, catalog) : [];
			}
			const finishedItem = catalog.findItemByItemPath<Article>(itemPath);
			return finishedItem ? [finishedItem] : [];
		};

		const itemsToProcess = getItemsToProcess();
		await Promise.all(itemsToProcess.map(collectUnsupportedElements));

		return unsupportedElements;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const itemPath = new Path(q.itemPath);
		const isCategory = q.isCategory === "true";

		return { ctx, itemPath, isCategory, catalogName };
	},
});

export default getErrorElements;
