import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import docx from "@dynamicImports/docx";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import t from "@ext/localization/locale/translate";
import ViewLocalizationFilter from "@ext/properties/logic/viewLocalizationFilter";
import RuleProvider from "@ext/rules/RuleProvider";
import buildDocumentTree from "@ext/wordExport/DocumentTree/buildDocumentTree";
import { ExportType } from "@ext/wordExport/ExportType";
import { getExportedKeys } from "@ext/wordExport/layouts";
import type { TitleInfo } from "@ext/wordExport/options/WordTypes";
import TemplateProcessor from "@ext/wordExport/TemplateProcessor";
import { MainWordExport } from "@ext/wordExport/WordExport";
import assert from "assert";
import { Command } from "../../types/Command";

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
