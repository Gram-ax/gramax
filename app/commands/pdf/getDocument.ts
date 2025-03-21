import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import { Command } from "../../types/Command";
import { pdfExportedKeys } from "@ext/pdfExport/layouts";
import RuleProvider from "@ext/rules/RuleProvider";
import PDFExporter from "@ext/pdfExport/PDFExporter";
import { TitleInfo } from "@ext/wordExport/options/WordTypes";
import buildDocumentTree from "@ext/wordExport/DocumentTree/buildDocumentTree";
import ViewLocalizationFilter from "@ext/properties/logic/viewLocalizationFilter";

const getDocument: Command<{ ctx: Context; itemPath?: Path; isCategory: boolean; catalogName: string }, Buffer> =
	Command.create({
		path: "pdf",
		kind: ResponseKind.file,

		async do({ ctx, catalogName, itemPath, isCategory }) {
			const { wm, parser, parserContextFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);

			const isCatalog = !itemPath?.value;
			const item = isCatalog
				? resolveRootCategory(catalog, catalog.props, ctx.contentLanguage)
				: catalog.findItemByItemPath(itemPath);

			const itemFilters = [
				...new RuleProvider(ctx, undefined, undefined).getItemFilters(),
				new ViewLocalizationFilter().getItemFilter(),
			];

			const filters = new RuleProvider(ctx).getItemFilters();

			const titlesMap: Map<string, TitleInfo> = new Map();

			const documentTrees = await buildDocumentTree(
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
			);

			const pdf = new PDFExporter(documentTrees, titlesMap, catalog, itemFilters);
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
