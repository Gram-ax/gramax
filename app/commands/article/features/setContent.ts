import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { Command } from "../../../types/Command";

const setContent: Command<{ catalogName: string; articlePath: Path; content: string }, void> = Command.create({
	path: "article/features/setContent",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ articlePath, catalogName, content }) {
		const catalog = await this._app.lib.getCatalog(catalogName);
		const article = catalog.findItemByItemPath(articlePath) as Article;
		if (!article) return;
		await article.updateContent(content);
	},

	params(_, q, body) {
		const articlePath = new Path(q.path);
		const catalogName = q.catalogName;
		return { articlePath, catalogName, content: body };
	},
});

export default setContent;
