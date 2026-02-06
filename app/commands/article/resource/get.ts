import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import parseContent from "@core/FileStructue/Article/parseContent";
import HashResourceManager from "@core/Hash/HashItems/HashResourceManager";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ArticleProvider, { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import assert from "assert";
import { Article } from "../../../../core/logic/FileStructue/Article/Article";

const get: Command<
	{
		src: Path;
		ctx: Context;
		articlePath: Path;
		catalogName: string;
		mimeType: MimeTypes;
		ifNotExistsErrorText: { title: string; message: string };
		providerType: ArticleProviderType;
	},
	{ mime: MimeTypes; hashItem: HashResourceManager }
> = Command.create({
	path: "article/resource/get",

	kind: ResponseKind.blob,

	async do({ src, mimeType, catalogName, articlePath, ifNotExistsErrorText, ctx, providerType }) {
		const { parser, parserContextFactory, wm } = this._app;
		const workspace = wm.current();

		const mime = mimeType ?? MimeTypes?.[src.extension] ?? `application/${src.extension}`;
		const catalog = await workspace.getCatalog(catalogName, ctx);
		assert(catalog);

		const article = providerType
			? ArticleProvider.getProvider(catalog, providerType).getArticle(articlePath.value)
			: catalog.findItemByItemPath<Article>(articlePath);

		if (!article) return;
		await parseContent(article, catalog, ctx, parser, parserContextFactory);

		ifNotExistsErrorText &&
			(await article.parsedContent.read((p) =>
				p?.parsedContext?.getResourceManager()?.assertExists(src, ifNotExistsErrorText),
			));

		const hashItem = await article.parsedContent.read((p) => {
			if (!p.parsedContext?.getResourceManager()) return null;
			return new HashResourceManager(src, p.parsedContext.getResourceManager(), ctx);
		});

		return { hashItem, mime };
	},

	params(ctx, q, body) {
		const src = new Path(q.src);
		const mimeType = q.mimeType as MimeTypes;
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		const providerType = q.providerType as ArticleProviderType;
		return { ctx, src, mimeType, catalogName, articlePath, ifNotExistsErrorText: body, providerType };
	},
});

export default get;
