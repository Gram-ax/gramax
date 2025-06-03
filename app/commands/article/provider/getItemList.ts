import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import ArticleProvider, { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { JSONContent } from "@tiptap/core";

const getItemList: Command<
	{
		ctx: Context;
		catalogName: string;
		type: ArticleProviderType;
	},
	JSONContent
> = Command.create({
	path: "article/provider/getItemList",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	kind: ResponseKind.plain,

	async do({ ctx, catalogName, type }) {
		const { wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;

		const provider = ArticleProvider.getProvider(catalog, type);
		return provider.getItems();
	},

	params(ctx, q) {
		const type = q.type as ArticleProviderType;
		return { ctx, catalogName: q.catalogName, type };
	},
});

export default getItemList;
