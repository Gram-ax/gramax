import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import ArticleProvider, { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";

const update: Command<
	{
		ctx: Context;
		catalogName: string;
		id: string;
		type: ArticleProviderType;
	},
	string
> = Command.create({
	path: "article/provider/getFileContent",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	kind: ResponseKind.plain,

	async do({ ctx, catalogName, id, type }) {
		const { wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;

		const provider = ArticleProvider.getProvider(catalog, type);
		return provider.getContent(id);
	},

	params(ctx, q) {
		const id = q.id;
		const type = q.type as ArticleProviderType;
		return { ctx, catalogName: q.catalogName, id, type };
	},
});

export default update;
