import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { Command, ResponseKind } from "../../../types/Command";

const getNames: Command<{ catalogName: string; articlePath: Path; ctx: Context }, string[]> = Command.create({
	path: "article/resource/getNames",

	kind: ResponseKind.json,

	middlewares: [],

	async do({ catalogName, articlePath, ctx }) {
		const { lib, parser, parserContextFactory } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const article = catalog.findItemByItemPath<Article>(articlePath);
		if (!article) return [];
		await parseContent(article, catalog, ctx, parser, parserContextFactory);
		return article.parsedContent.resourceManager.resources.map((r) => r.value);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { ctx, catalogName, articlePath };
	},
});

export default getNames;
