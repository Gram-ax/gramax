import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import type { CommentBlock } from "@core-ui/CommentBlock";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import assert from "assert";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "../../../../core/logic/Api/middleware/DesktopModeMiddleware";
import Path from "../../../../core/logic/FileProvider/Path/Path";
import { Command } from "../../../types/Command";

const getAllComments: Command<
	{ ctx: Context; catalogName: string; articlePath: Path },
	Record<string, CommentBlock>
> = Command.create({
	path: "comments/getAll",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	flags: ["otel-omit-result"],

	async do({ ctx, articlePath, catalogName }) {
		const { parserContextFactory } = this._app;
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		assert(catalog, "Catalog not found");

		const article = catalog.findItemByItemPath<Article>(articlePath);
		assert(article, `Article ${articlePath.value} not found`);

		const context = await parserContextFactory.fromArticle(
			article,
			catalog,
			convertContentToUiLanguage(ctx.contentLanguage || catalog.props.language),
		);

		const provider = catalog.customProviders.commentProvider;
		return await provider.getAllComments(articlePath, context);
	},

	params(ctx, q) {
		const articlePath = new Path(q.articlePath);
		const catalogName = q.catalogName;
		return { ctx, articlePath, catalogName };
	},
});

export default getAllComments;
