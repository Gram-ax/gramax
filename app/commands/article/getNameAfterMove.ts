import { NEW_CATALOG_NAME } from "@app/config/const";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { uniqueName } from "@core/utils/uniqueName";
import { resolveArticleUniqueNamePair } from "@ext/article/utils/resolveArticleUniqueNamePair";
import t from "@ext/localization/locale/translate";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import assert from "assert";
import { Command } from "../../types/Command";

export interface GetNameAfterMoveProps {
	ctx: Context;
	articlePath: Path;
	sourceCatalogName: string;
	targetWorkspacePath: WorkspacePath;
	targetCatalogName: string;
	createNewCatalog: boolean;
}

export interface GetNameAfterMoveResult {
	originalName: string;
	originalTitle: string;
	resolvedName: string;
	resolvedTitle: string;
	createdCatalogName: string | null;
	idx: number;
	exists: boolean;
}

const getNameAfterMove: Command<GetNameAfterMoveProps, GetNameAfterMoveResult> = Command.create({
	path: "article/getNameAfterMove",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({
		articlePath,
		targetWorkspacePath,
		targetCatalogName,
		sourceCatalogName,
		createNewCatalog,
	}: GetNameAfterMoveProps) {
		const { wm } = this._app;

		const current = wm.current();

		assert(current.path() == targetWorkspacePath, "not supported");

		const sourceCatalog = await current.getContextlessCatalog(sourceCatalogName);
		assert(sourceCatalog, `catalog not found: ${sourceCatalogName}`);

		let targetCatalog: Catalog;

		if (createNewCatalog) {
			targetCatalog = await current.getFileStructure().createCatalog({
				url: uniqueName(NEW_CATALOG_NAME, Array.from(current.getAllCatalogs().keys())),
				title: t("catalog.new-name"),
				syntax: Syntax.xml,
			});

			await current.addCatalog(targetCatalog);
		} else {
			targetCatalog = await current.getContextlessCatalog(targetCatalogName);
		}

		assert(targetCatalog, `catalog not found: ${targetCatalogName}`);

		const sourceItem = sourceCatalog.findItemByItemPath(articlePath);
		assert(sourceItem, `source article of catalog ${sourceCatalog.name} not found: ${articlePath.value}`);

		const originalName = sourceItem.getFileName();
		const originalTitle = sourceItem.getTitle();

		const { name, title, idx, exists } = resolveArticleUniqueNamePair(targetCatalog.getRootCategory(), sourceItem);

		return {
			originalName,
			originalTitle,
			resolvedName: name,
			resolvedTitle: title,
			createdCatalogName: createNewCatalog ? targetCatalog.name : null,
			idx,
			exists,
		};
	},

	params(ctx, q): GetNameAfterMoveProps {
		const articlePath = new Path(q.articlePath);
		const targetWorkspacePath = q.targetWorkspacePath;
		const sourceCatalogName = q.sourceCatalogName;
		const targetCatalogName = q.targetCatalogName;
		const createNewCatalog = q.createNewCatalog === "true";

		return {
			ctx,
			articlePath,
			targetWorkspacePath,
			targetCatalogName,
			sourceCatalogName,
			createNewCatalog,
		};
	},
});

export default getNameAfterMove;
