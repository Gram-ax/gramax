import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";
import { Command } from "../../../types/Command";

const createLinkFromHref: Command<
	{ ctx: Context; articlePath: Path; catalogName: string; from: string; href: string },
	{ href: string; hash: string; resourcePath: string; isFile: boolean }
> = Command.create({
	path: "article/features/createLinkFromHref",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ ctx, catalogName, articlePath, href }) {
		const { wm, parserContextFactory } = this._app;
		const workspace = wm.current();
		if (!RouterPathProvider.isEditorPathname(href)) return null;

		const parsedPath = RouterPathProvider.parsePath(href);
		if (!parsedPath) return;

		const targetCatalog = await workspace.getCatalog(parsedPath.catalogName, ctx);
		if (!targetCatalog) return;

		const targetArticle = targetCatalog.findArticle(parsedPath.itemLogicPath.join("/"), []);
		if (!targetArticle) return;

		const currentCatalog = await workspace.getCatalog(catalogName, ctx);
		if (!currentCatalog) return;

		const currentArticle = currentCatalog.findItemByItemPath<Article>(articlePath);
		if (!currentArticle) return;

		const context = await parserContextFactory.fromArticle(
			currentArticle,
			currentCatalog,
			convertContentToUiLanguage(ctx.contentLanguage || currentCatalog.props.language),
			ctx.user.isLogged,
		);
		const relativePath = currentArticle.ref.path.getRelativePath(targetArticle.ref.path).value.replace(".md", "");

		const { href: newHref, hash, isFile, resourcePath } = await linkCreator.getLink(relativePath, context);
		return { href: newHref, hash: hash ?? "", resourcePath: resourcePath?.value ?? relativePath ?? "", isFile };
	},

	params(ctx, q) {
		const articlePath = new Path(q.articlePath);
		const catalogName = q.catalogName;
		const from = q.from;
		const href = q.href;
		return { ctx, articlePath, catalogName, from, href };
	},
});

export default createLinkFromHref;
