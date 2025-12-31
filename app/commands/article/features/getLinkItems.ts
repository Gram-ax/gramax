import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import LinkItemCreator from "@ext/article/LinkCreator/logic/LinkItemCreator";
import type LinkItem from "@ext/article/LinkCreator/models/LinkItem";
import ArticleProvider, { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";

const getLinkItems: Command<
	{ ctx: Context; path: Path; catalogName: string; currentCatalogName: string; providerType: ArticleProviderType },
	LinkItem[]
> = Command.create({
	path: "article/features/getLinkItems",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, path, catalogName, currentCatalogName, providerType }) {
		const workspace = this._app.wm.current();
		if (!catalogName) return [];

		const currentCatalog = await workspace.getCatalog(currentCatalogName, ctx);
		if (!currentCatalog) return [];

		const getPathFromProvider = () => {
			const provider = ArticleProvider.getProvider(currentCatalog, providerType);
			const article = provider.getArticle(path.value);
			return article.ref.path;
		};

		const catalog = await workspace.getCatalog(catalogName, ctx);

		const articlePath = providerType ? getPathFromProvider() : path;
		return await new LinkItemCreator(ctx, catalog).getLinkItems(articlePath);
	},

	params(ctx, q) {
		const path = new Path(q.path);
		const catalogName = q.catalogName;
		const currentCatalogName = q.currentCatalogName;
		const providerType = q.providerType as ArticleProviderType;
		return { ctx, path, catalogName, currentCatalogName, providerType };
	},
});

export default getLinkItems;
