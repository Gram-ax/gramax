import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Command } from "../../types/Command";

const create: Command<{ ctx: Context; catalogName: string; parentPath?: Path }, string> = Command.create({
	path: "article/create",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, parentPath }) {
		const { resourceUpdaterFactory, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const fp = workspace.getFileProvider();
		const parentRef = fp.getItemRef(parentPath);

		const markdown = "\n\n";
		const article = await catalog.createArticle(resourceUpdaterFactory, markdown, parentPath ? parentRef : null);

		return await catalog.getPathname(article);
	},

	params(ctx: Context, query: { [key: string]: string }) {
		const catalogName = query.catalogName;
		const parentPath = query.parentPath ? new Path(query.parentPath) : null;
		return { ctx, catalogName, parentPath };
	},
});

export default create;
