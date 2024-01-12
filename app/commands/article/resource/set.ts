import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import HashResourceManager from "@core/Hash/HashItems/HashResourceManager";
import { Buffer } from "buffer";
import { Command, ResponseKind } from "../../../types/Command";

const set: Command<
	{ data: any; isBase64: boolean; src: Path; catalogName: string; articlePath: Path; ctx: Context },
	void
> = Command.create({
	path: "article/resource/set",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware()],

	async do({ data, isBase64, src, catalogName, articlePath, ctx }) {
		const { hashes, lib, parser, parserContextFactory } = this._app;

		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProvider(catalog.getRootCategoryRef().storageId);
		const itemRef = fp.getItemRef(articlePath);
		const article = catalog.findItemByItemPath(itemRef.path) as Article;
		await parseContent(article, catalog, ctx, parser, parserContextFactory);
		const hashItem = new HashResourceManager(src, article.parsedContent.resourceManager);
		await article.parsedContent.resourceManager.setContent(src, isBase64 ? Buffer.from(data, "base64") : data);
		hashes.deleteHash(hashItem);
	},

	params(ctx, q, body) {
		const data = body;
		const isBase64 = q.isBase64 === "true";
		const src = new Path(q.src);
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { ctx, data, isBase64, src, catalogName, articlePath };
	},
});

export default set;
