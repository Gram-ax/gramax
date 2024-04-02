import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import { Command } from "../../types/Command";

const remove: Command<{ ctx: Context; catalogName: string; path: Path }, void> = Command.create({
	path: "item/remove",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, path }) {
		const { lib, parser, parserContextFactory } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		const articleParser = new ArticleParser(ctx, parser, parserContextFactory);
		await catalog.deleteItem(fp.getItemRef(path), articleParser);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const path = new Path(q.articlePath);
		return { ctx, catalogName, path };
	},
});

export default remove;
