import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { FavoriteArticleData } from "@ext/article/Favorite/models/types";

const add: Command<{ ctx: Context; catalogName: string; paths: string[] }, FavoriteArticleData[]> = Command.create({
	path: "catalog/favorite/getArticlesData",

	middlewares: [new ReloadConfirmMiddleware()],

	kind: ResponseKind.json,

	async do({ ctx, catalogName, paths }) {
		const { wm } = this._app;

		const catalog = await wm.current().getCatalog(catalogName, ctx);
		if (!catalog) throw new Error(`Catalog '${catalogName} not found`);

		const data = [];

		let id = 0;
		for (const path of paths) {
			const article = catalog.findItemByItemPath(new Path(path));
			if (!article) continue;

			data.push({
				id: id++,
				title: article.getTitle(),
				pathname: await catalog.getPathname(article),
			});
		}

		return data;
	},

	params(ctx, q, body) {
		return { ctx, catalogName: q.catalogName, paths: body };
	},
});

export default add;
