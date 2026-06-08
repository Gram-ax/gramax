import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import type { JSONContent } from "@tiptap/core";
import { Command } from "../../../types/Command";

const setContent: Command<
	{ ctx: Context; catalogName: string; articlePath: Path; content: string; rawMarkdown: boolean },
	JSONContent
> = Command.create({
	path: "article/features/setContent",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, articlePath, catalogName, content, rawMarkdown }) {
		const { wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const article = catalog.findItemByItemPath<Article>(articlePath);
		if (!article) return;
		if (rawMarkdown) await article.rawUpdateContent(content ?? "");
		else await article.updateContent(content ?? "");
		await article.events.emit("item-update-content", { item: article });

		await parseContent(article, catalog, ctx, parser, parserContextFactory);
		const editTree = await article.parsedContent.read((p) => p.editTree);

		return getArticleWithTitle(article.props.title, editTree);
	},

	params(ctx, q, body) {
		const articlePath = new Path(q.path);
		const catalogName = q.catalogName;
		const rawMarkdown = q.rawMarkdown === "true";
		return { ctx, articlePath, catalogName, content: body, rawMarkdown };
	},
});

export default setContent;
