import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import { JSONContent } from "@tiptap/core";

const updateContent: Command<{ ctx: Context; articlePath: Path; catalogName: string; editTree: JSONContent }, void> =
	Command.create({
		path: "article/updateContent",

		kind: ResponseKind.json,

		middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, articlePath, catalogName, editTree }) {
			const { formatter, parser, parserContextFactory, wm } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return;

			const article = catalog.findItemByItemPath<Article>(articlePath);
			if (!article) return;

			const context = await parserContextFactory.fromArticle(
				article,
				catalog,
				convertContentToUiLanguage(ctx.contentLanguage || catalog.props.language),
				ctx.user.isLogged,
			);
			const markdown = await formatter.render(editTree, context);
			await article.updateContent(markdown);
			await article.parsedContent.write(() => parser.parse(article.content, context));
		},

		params(ctx, q, body) {
			const articlePath = new Path(q.path);
			const catalogName = q.catalogName;
			const editTree = body as JSONContent;
			return { ctx, articlePath, catalogName, editTree };
		},
	});

export default updateContent;
