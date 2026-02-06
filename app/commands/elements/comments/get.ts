import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Article } from "@core/FileStructue/Article/Article";
import { CommentBlock } from "@core-ui/CommentBlock";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import assert from "assert";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "../../../../core/logic/Api/middleware/DesktopModeMiddleware";
import Path from "../../../../core/logic/FileProvider/Path/Path";
import { Command } from "../../../types/Command";

const getComment: Command<{ ctx: Context; catalogName: string; articlePath: Path; commentId: string }, CommentBlock> =
	Command.create({
		path: "comments/get",

		kind: ResponseKind.plain,

		middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

		async do({ ctx, articlePath, commentId, catalogName }) {
			const { parserContextFactory } = this._app;
			const workspace = this._app.wm.current();
			const catalog = await workspace.getCatalog(catalogName, ctx);
			assert(catalog, "Catalog not found");

			const article = catalog.findItemByItemPath<Article>(articlePath);
			assert(article, "Article not found");

			const context = await parserContextFactory.fromArticle(
				article,
				catalog,
				convertContentToUiLanguage(ctx.contentLanguage || catalog.props.language),
				ctx.user.isLogged,
			);

			const provider = catalog.customProviders.commentProvider;
			return await provider.getComment(commentId, articlePath, context);
		},

		params(ctx, q) {
			const articlePath = new Path(q.articlePath);
			const commentId = q.id;
			const catalogName = q.catalogName;
			return { ctx, articlePath, commentId, catalogName };
		},
	});

export default getComment;
