import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { Command } from "../../../types/Command";

const remove: Command<{ src: Path; articlePath: Path; catalogName: string; ctx: Context }, void> = Command.create({
	path: "article/resource/remove",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware()],

	async do({ src, articlePath, catalogName, ctx }) {
		if (!src?.value) return;
		const { parser, parserContextFactory, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const fp = workspace.getFileProvider();
		const itemRef = fp.getItemRef(articlePath);
		const article = catalog.findItemByItemRef<Article>(itemRef);
		if (!article) return;
		await parseContent(article, catalog, ctx, parser, parserContextFactory);
		await article.parsedContent.resourceManager.delete(src);
	},

	params(ctx, q) {
		const src = new Path(q.src);
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { ctx, src, catalogName, articlePath };
	},
});

export default remove;
