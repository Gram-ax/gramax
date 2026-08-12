import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type Path from "@core/FileProvider/Path/Path";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import { getPdfExportedKeys } from "@ext/pdfExport/layouts";
import PDFExporter from "@ext/pdfExport/PDFExporter";
import ViewLocalizationFilter from "@ext/properties/logic/viewLocalizationFilter";
import RuleProvider from "@ext/rules/RuleProvider";
import buildDocumentTree from "@ext/wordExport/DocumentTree/buildDocumentTree";
import type { TitleInfo } from "@ext/wordExport/options/WordTypes";

interface legacyExportProps {
	ctx: Context;
	itemPath?: Path;
	isCategory: boolean;
	catalogName: string;
}

const legacyExport =
	(app: Application) =>
	async ({ ctx, catalogName, itemPath, isCategory }: legacyExportProps) => {
		const { wm, parser, parserContextFactory } = app;
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
			getPdfExportedKeys(),
			catalog,
			ctx,
			parser,
			parserContextFactory,
			filters,
			titlesMap,
		);

		const pdf = new PDFExporter(documentTrees, titlesMap, catalog, itemFilters);
		return pdf.create();
	};

export default legacyExport;
