import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import HashResourceManager from "@core/Hash/HashItems/HashResourceManager";
import { Command } from "../../../types/Command";
import createImage from "@ext/markdown/elements/copyMsO/createImage";

const createFromPath: Command<
	{ resourcePath: Path; resourceName: string; catalogName: string; articlePath: Path; ctx: Context },
	{ newName: string }
> = Command.create({
	path: "article/resource/createFromPath",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ resourcePath, resourceName, catalogName, articlePath, ctx }) {
		const { hashes, wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName);
		const fp = workspace.getFileProvider();
		const itemRef = fp.getItemRef(articlePath);
		const article = catalog.findItemByItemPath<Article>(itemRef.path);
		if (!article) return;
		const { newName, data } = await createImage(article, fp, articlePath, resourcePath, resourceName);

		await parseContent(article, catalog, ctx, parser, parserContextFactory);
		const hashItem = new HashResourceManager(newName, article.parsedContent.resourceManager);
		await article.parsedContent.resourceManager.setContent(newName, data);
		hashes.deleteHash(hashItem);
		return { newName: newName.toString() };
	},

	params(ctx, q, body) {
		const data = body;
		const resourcePath = new Path(q.resourcePath);
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		const resourceName = q.resourceName;
		return { ctx, data, resourcePath, catalogName, articlePath, resourceName };
	},
});

export default createFromPath;
