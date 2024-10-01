import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import RuleProvider from "@ext/rules/RuleProvider";
import buildDocumentTree from "@ext/wordExport/DocumentTree/buildDocumentTree";
import { ExportType } from "@ext/wordExport/ExportType";
import { exportedKeys } from "@ext/wordExport/layouts";
import { MainWordExport } from "@ext/wordExport/WordExport";
import { Command } from "../../types/Command";

const docx = import("docx");

const getAsWordDocument: Command<{ ctx: Context; itemPath?: Path; isCategory: boolean; catalogName: string }, Buffer> =
	Command.create({
		path: "word",
		kind: ResponseKind.file,

		async do({ ctx, catalogName, isCategory, itemPath }) {
			const { wm, parser, parserContextFactory } = this._app;
			const workspace = wm.current();
			const catalog = await workspace.getCatalog(catalogName);
			const isCatalog = itemPath.toString() === "";
			const item = isCatalog
				? resolveRootCategory(catalog, ctx.contentLanguage)
				: catalog.findItemByItemPath(itemPath);
			const wordExport = new MainWordExport(ExportType.withoutTableOfContents, ctx.domain);
			const filters = new RuleProvider(ctx).getItemFilters();
			const documentTree = await buildDocumentTree(
				isCategory,
				isCatalog,
				item,
				exportedKeys,
				catalog,
				ctx,
				parser,
				parserContextFactory,
				filters,
			);

			return await (await docx).Packer.toBuffer(await wordExport.getDocument(documentTree));
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const itemPath = new Path(q.itemPath);
			const isCategory = q.isCategory === "true";

			return { ctx, itemPath, isCategory, catalogName };
		},
	});

export default getAsWordDocument;
