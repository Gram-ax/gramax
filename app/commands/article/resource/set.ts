import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import HashResourceManager from "@core/Hash/HashItems/HashResourceManager";
import { Command } from "../../../types/Command";

const set: Command<{ data: any; src: Path; catalogName: string; articlePath: Path; ctx: Context }, void> =
	Command.create({
		path: "article/resource/set",

		kind: ResponseKind.none,

		middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ data, src, catalogName, articlePath, ctx }) {
			const { hashes, wm, parser, parserContextFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			const fp = workspace.getFileProvider();
			const itemRef = fp.getItemRef(articlePath);
			const article = catalog.findItemByItemPath<Article>(itemRef.path);
			if (!article) return;
			await parseContent(article, catalog, ctx, parser, parserContextFactory);
			const hashItem = new HashResourceManager(src, article.parsedContent.resourceManager);
			await article.parsedContent.resourceManager.setContent(src, data);
			hashes.deleteHash(hashItem);
		},

		params(ctx, q, body) {
			const data = body;
			const src = new Path(q.src);
			const catalogName = q.catalogName;
			const articlePath = new Path(q.articlePath);
			return { ctx, data, src, catalogName, articlePath };
		},
	});

export default set;
