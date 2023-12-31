import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import { Command, ResponseKind } from "../../types/Command";

const create: Command<{ ctx: Context; catalogName: string; parentPath?: Path }, string> = Command.create({
	path: "article/create",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ ctx, catalogName, parentPath }) {
		const { formatter, lib, parser, parserContextFactory } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		const parentRef = fp.getItemRef(parentPath);

		const markdown = "\n\n";
		const article = await catalog.createArticle(
			new ResourceUpdater(ctx, parser, parserContextFactory, formatter),
			markdown,
			ctx.lang ?? defaultLanguage,
			parentPath ? parentRef : null,
		);

		return article.logicPath;
	},

	params(ctx: Context, query: { [key: string]: string }) {
		const catalogName = query.catalogName;
		const parentPath = query.parentPath ? new Path(query.parentPath) : null;
		return { ctx, catalogName, parentPath };
	},
});

export default create;
