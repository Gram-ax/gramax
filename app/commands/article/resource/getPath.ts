import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import parseContent from "@core/FileStructue/Article/parseContent";
import ArticleProvider, { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import assert from "assert";
import { Article } from "../../../../core/logic/FileStructue/Article/Article";

const getPath: Command<
	{
		path: Path;
		ctx: Context;
		articlePath: Path;
		catalogName: string;
		providerType: ArticleProviderType;
	},
	string
> = Command.create({
	path: "article/resource/getPath",

	kind: ResponseKind.plain,

	async do({ path, catalogName, articlePath, ctx, providerType }) {
		const { parser, parserContextFactory, wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		assert(catalog);

		const article = providerType
			? ArticleProvider.getProvider(catalog, providerType).getArticle(articlePath.value)
			: catalog.findItemByItemPath<Article>(articlePath);

		if (!article) return;
		await parseContent(article, catalog, ctx, parser, parserContextFactory);

		return await article.parsedContent.read((p) => {
			return p.parsedContext.getResourceManager()?.getAbsolutePath(path).value;
		});
	},

	params(ctx, q) {
		const path = new Path(q.path);
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		const providerType = q.providerType as ArticleProviderType;
		return { ctx, path, catalogName, articlePath, providerType };
	},
});

export default getPath;
