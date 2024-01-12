import { Command, ResponseKind } from "@app/types/Command";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import parseContent from "@core/FileStructue/Article/parseContent";
import HashResourceManager from "@core/Hash/HashItems/HashResourceManager";
import { Article } from "../../../../core/logic/FileStructue/Article/Article";

const get: Command<
	{ src: Path; mimeType: MimeTypes; catalogName: string; articlePath: Path; ctx: Context },
	{ mime: MimeTypes; hashItem: HashResourceManager }
> = Command.create({
	path: "article/resource/get",

	kind: ResponseKind.blob,

	async do({ src, mimeType, catalogName, articlePath, ctx }) {
		const { lib, parser, parserContextFactory } = this._app;
		const mime = mimeType ?? MimeTypes?.[src.extension] ?? `application/${src.extension}`;
		const catalog = await lib.getCatalog(catalogName);
		const article = catalog.findItemByItemPath(articlePath) as Article;
		if (!article) return;
		await parseContent(article, catalog, ctx, parser, parserContextFactory);
		const hashItem = new HashResourceManager(src, article.parsedContent.resourceManager);
		return { hashItem, mime };
	},

	params(ctx, q) {
		const src = new Path(q.src);
		const mimeType = q.mimeType as MimeTypes;
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { ctx, src, mimeType, catalogName, articlePath };
	},
});

export default get;
