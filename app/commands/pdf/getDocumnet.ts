import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import { Command } from "../../types/Command";
import { pdfExportedKeys } from "@ext/pdfExport/layouts";
import buildDocumentTree from "@ext/pdfExport/buildDocumentTree";
import RuleProvider from "@ext/rules/RuleProvider";
import PDFExporter from "@ext/pdfExport/PDFExporter";

const getDocument: Command<{ ctx: Context; itemPath?: Path; isCategory: boolean; catalogName: string }, Buffer> =
	Command.create({
		path: "pdf",
		kind: ResponseKind.file,

		async do({ ctx, catalogName, itemPath, isCategory }) {
			const { wm, parser, parserContextFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);

			const isCatalog = !itemPath;
			const item = isCatalog
				? resolveRootCategory(catalog, catalog.props, ctx.contentLanguage)
				: catalog.findItemByItemPath(itemPath);

			const filters = new RuleProvider(ctx).getItemFilters();

			const titlesMap = new Map();
			const itemsToProcess = [item];

			const documentTrees = await Promise.all(
				itemsToProcess.map(async (currentItem) => {
					return await buildDocumentTree({
						isCategory,
						isCatalog,
						item: currentItem,
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

			const pdf = new PDFExporter(item.getFileName(), documentTrees);
			return pdf.create();
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const itemPath = new Path(q.itemPath);
			const isCategory = q.isCategory === "true";

			return { ctx, itemPath, isCategory, catalogName };
		},
	});

export default getDocument;
