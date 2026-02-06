import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import ArticleProvider, { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { Command } from "../../../types/Command";

const getBrotherNames: Command<
	{ articlePath: Path; ctx: Context; providerType: ArticleProviderType; catalogName: string },
	string[]
> = Command.create({
	path: "article/features/getBrotherNames",

	kind: ResponseKind.json,

	middlewares: [],

	async do({ ctx, articlePath, providerType, catalogName }) {
		const workspace = this._app.wm.current();
		const fp = workspace.getFileProvider();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		const provider = providerType ? ArticleProvider.getProvider(catalog, providerType) : undefined;
		const article = provider ? provider.getArticle(articlePath.value) : undefined;
		if (provider && !article) return;

		const items = provider
			? await fp.getItems(provider.getArticle(articlePath.value).ref.path.parentDirectoryPath)
			: await fp.getItems(articlePath.parentDirectoryPath);

		return items.map((i) => "./" + i.name);
	},

	params(ctx, q) {
		const articlePath = new Path(q.articlePath);
		const providerType = q.providerType as ArticleProviderType;
		const catalogName = q.catalogName;
		return { ctx, articlePath, providerType, catalogName };
	},
});

export default getBrotherNames;
