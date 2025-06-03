import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import ArticleProvider, { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { JSONContent } from "@tiptap/core";

const getEditTree: Command<
	{
		ctx: Context;
		catalogName: string;
		id: string;
		type: ArticleProviderType;
	},
	JSONContent
> = Command.create({
	path: "article/provider/getEditTree",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	kind: ResponseKind.plain,

	async do({ ctx, catalogName, id, type }) {
		const { wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;

		const provider = ArticleProvider.getProvider(catalog, type);
		return provider.getEditTree(id, parser, parserContextFactory, ctx);
	},

	params(ctx, q) {
		const id = q.id;
		const type = q.type as ArticleProviderType;
		return { ctx, catalogName: q.catalogName, id, type };
	},
});

export default getEditTree;
