import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { Category } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import MarkdownProcessor from "@ext/wordExport/MarkdownProcessor";
import { exportedKeys } from "@ext/wordExport/layouts";
import { Command } from "../../types/Command";

const getErrorElements: Command<{ ctx: Context; itemPath: Path; isCategory: boolean; catalogName: string }, string[]> =
	Command.create({
		path: "word/getErrorElements",
		kind: ResponseKind.json,

		async do({ ctx, catalogName, itemPath, isCategory }) {
			const { wm, parser, parserContextFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName);
			const markdownProcessor = new MarkdownProcessor(exportedKeys);
			const unsupportedElements = new Set<string>();
			const isCatalog = itemPath.toString() === "";

			const collectUnsupportedElements = async (item: Item) => {
				await parseContent(item as Article, catalog, ctx, parser, parserContextFactory);
				const elements = markdownProcessor.getUnsupportedElements(
					(item as Article).parsedContent.renderTree as Tag,
				);

				elements.forEach((element) => unsupportedElements.add(element));

				if (item instanceof Category && (isCategory || isCatalog))
					await Promise.all(item.items.map(collectUnsupportedElements));
			};

			const getItemsToProcess = () => {
				if (isCategory) {
					const finishedItem = catalog.findItemByItemPath<Category>(itemPath);
					return finishedItem ? [finishedItem] : [];
				} else if (isCatalog) {
					const rootCategory = catalog.getRootCategory();
					return rootCategory instanceof Category ? rootCategory.items : [];
				}

				const finishedItem = catalog.findItemByItemPath<Article>(itemPath);
				return finishedItem ? [finishedItem] : [];
			};

			const itemsToProcess = getItemsToProcess();
			await Promise.all(itemsToProcess.map(collectUnsupportedElements));

			return Array.from(unsupportedElements);
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const itemPath = new Path(q.itemPath);
			const isCategory = q.isCategory === "true";

			return { ctx, itemPath, isCategory, catalogName };
		},
	});

export default getErrorElements;
