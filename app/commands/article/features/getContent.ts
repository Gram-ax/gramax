import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { Command } from "../../../types/Command";

const getContent: Command<{ ctx: Context; catalogName: string; articlePath: Path }, string> = Command.create({
	path: "article/features/getContent",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ ctx, articlePath, catalogName }) {
		const catalog = await this._app.wm.current().getCatalog(catalogName, ctx);
		const article = catalog.findItemByItemPath<Article>(articlePath);
		if (!article) return;
		return article.content;
	},

	params(ctx, q) {
		const articlePath = new Path(q.path);
		const catalogName = q.catalogName;
		return { ctx, articlePath, catalogName };
	},
});

export default getContent;
