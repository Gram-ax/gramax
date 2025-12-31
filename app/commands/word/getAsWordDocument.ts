import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import RuleProvider from "@ext/rules/RuleProvider";
import buildDocumentTree from "@ext/wordExport/DocumentTree/buildDocumentTree";
import { ExportType } from "@ext/wordExport/ExportType";
import { getExportedKeys } from "@ext/wordExport/layouts";
import { MainWordExport } from "@ext/wordExport/WordExport";
import { Command } from "../../types/Command";
import { TitleInfo } from "@ext/wordExport/options/WordTypes";
import ViewLocalizationFilter from "@ext/properties/logic/viewLocalizationFilter";
import TemplateProcessor from "@ext/wordExport/TemplateProcessor";
import t from "@ext/localization/locale/translate";
import assert from "assert";
import docx from "@dynamicImports/docx";

const getAsWordDocument: Command<
	{ ctx: Context; itemPath?: Path; isCategory: boolean; catalogName: string; wordTemplate?: string | Buffer },
	Buffer
> = Command.create({
	path: "word",
	kind: ResponseKind.file,

	async do({ ctx, catalogName, isCategory, itemPath, wordTemplate }) {
		const { wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		const isCatalog = itemPath.toString() === "";
		const item = isCatalog
			? resolveRootCategory(catalog, catalog.props, ctx.contentLanguage)
			: catalog.findItemByItemPath(itemPath);
		const itemFilters = [
			...new RuleProvider(ctx, undefined, undefined).getItemFilters(),
			new ViewLocalizationFilter().getItemFilter(),
		];
		const filters = new RuleProvider(ctx).getItemFilters();
		const titlesMap: Map<string, TitleInfo> = new Map();
		const documentTree = await buildDocumentTree(
			isCategory,
			isCatalog,
			item,
			getExportedKeys(),
			catalog,
			ctx,
			parser,
			parserContextFactory,
			filters,
			titlesMap,
		);
		const wordExport = new MainWordExport(ExportType.withoutTableOfContents, titlesMap, catalog, itemFilters);

		if (wordTemplate) {
			const templateBuffer =
				typeof wordTemplate === "string"
					? await workspace.getAssets().wordTemplates.getContent(wordTemplate)
					: wordTemplate;

			assert(templateBuffer, t("word.template.error.template-not-found"));

			const docxSections = await wordExport.getSections(documentTree, isCatalog, true);
			const documentProps = {
				title: item.getTitle(),
			};

			const templateProcessor = new TemplateProcessor(templateBuffer, docxSections, documentProps);
			const mergedDocument = await templateProcessor.merge();

			return mergedDocument;
		}

		return await (await docx()).Packer.toBuffer(await wordExport.getDocument(documentTree));
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const itemPath = new Path(q.itemPath);
		const isCategory = q.isCategory === "true";
		const wordTemplate = q.wordTemplateName;

		return { ctx, itemPath, isCategory, catalogName, wordTemplate };
	},
});

export default getAsWordDocument;
