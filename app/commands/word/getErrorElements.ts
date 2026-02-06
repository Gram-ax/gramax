import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { Category } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import { UnsupportedElements } from "@ext/import/model/UnsupportedElements";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import { tString } from "@ext/localization/locale/translate";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { getPdfExportedKeys } from "@ext/pdfExport/layouts";
import RuleProvider from "@ext/rules/RuleProvider";
import { ExportFormat } from "@ext/wordExport/components/ItemExport";
import { getExportedKeys } from "@ext/wordExport/layouts";
import MarkdownElementsFilter from "@ext/wordExport/MarkdownElementsFilter";
import { Command } from "../../types/Command";

const getErrorElements: Command<
	{ ctx: Context; itemPath: Path; isCategory: boolean; catalogName: string; exportFormat: ExportFormat },
	UnsupportedElements[]
> = Command.create({
	path: "word/getErrorElements",
	kind: ResponseKind.json,

	async do({ ctx, catalogName, itemPath, isCategory, exportFormat }) {
		const { wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();
		const itemFilters = new RuleProvider(ctx).getItemFilters();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		const markdownElementsFilter = new MarkdownElementsFilter(
			exportFormat === ExportFormat.docx ? getExportedKeys() : getPdfExportedKeys(),
		);
		const unsupportedElements: UnsupportedElements[] = [];
		const isCatalog = itemPath.toString() === "";

		const collectUnsupportedElements = async (item: Item) => {
			const article = {
				id: item.order?.toString() || "0",
				title: item.getTitle(),
				link: await catalog.getPathname(item),
			};

			try {
				await parseContent(item as Article, catalog, ctx, parser, parserContextFactory);

				const elements = await (item as Article).parsedContent.read((p) => {
					return markdownElementsFilter.getUnsupportedElements(p.renderTree as Tag);
				});

				if (elements.size > 0)
					unsupportedElements.push({
						article,
						elements: Array.from(elements, ([name, count]) => ({
							name: tString(name),
							count,
						})),
					});
			} catch (error) {
				unsupportedElements.push({
					article,
					elements: [
						{
							name: tString("markdown-error"),
							count: 1,
						},
					],
				});
			}

			if (item instanceof Category && (isCategory || isCatalog))
				await item.getFilteredItems(itemFilters, catalog).forEachAsync(collectUnsupportedElements);
		};

		const getItemsToProcess = () => {
			if (isCatalog) {
				const rootCategory = resolveRootCategory(catalog, catalog.props, ctx.contentLanguage);
				return rootCategory instanceof Category ? rootCategory.getFilteredItems(itemFilters, catalog) : [];
			}
			if (isCategory) {
				const finishedItem = catalog.findItemByItemPath<Category>(itemPath);
				return finishedItem ? [finishedItem] : [];
			}
			const finishedItem = catalog.findItemByItemPath<Article>(itemPath);
			return finishedItem ? [finishedItem] : [];
		};

		const itemsToProcess = getItemsToProcess();
		await itemsToProcess.forEachAsync(collectUnsupportedElements);

		return unsupportedElements;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const itemPath = new Path(q.itemPath);
		const isCategory = q.isCategory === "true";
		const exportFormat = q.exportFormat as ExportFormat;

		return { ctx, itemPath, isCategory, catalogName, exportFormat };
	},
});

export default getErrorElements;
