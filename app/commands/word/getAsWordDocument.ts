import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import RuleProvider from "@ext/rules/RuleProvider";
import buildDocumentTree from "@ext/wordExport/DocumentTree/buildDocumentTree";
import { exportedKeys } from "@ext/wordExport/layouts";
import { MainWordExport } from "@ext/wordExport/WordExport";
import { ExportType } from "../../../core/extensions/wordExport/ExportType";
import { Command } from "../../types/Command";

const docx = import("docx");

const getAsWordDocument: Command<{ ctx: Context; itemPath?: Path; isCategory: boolean; catalogName: string }, Blob> =
	Command.create({
		path: "word",
		kind: ResponseKind.file,

		async do({ ctx, catalogName, isCategory, itemPath }) {
			const { wm, parser, parserContextFactory } = this._app;
			const workspace = wm.current();
			const catalog = await workspace.getCatalog(catalogName);
			const isCatalog = itemPath.toString() === "";
			const item = isCatalog ? catalog.getRootCategory() : catalog.findItemByItemPath(itemPath);
			const wordExport = new MainWordExport(workspace.getFileProvider(), ExportType.withoutTableOfContents);
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

			const document = await wordExport.getDocument(documentTree);

			return await (await docx).Packer.toBlob(document);
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const itemPath = new Path(q.itemPath);
			const isCategory = q.isCategory === "true";

			return { ctx, itemPath, isCategory, catalogName };
		},
	});

export default getAsWordDocument;
