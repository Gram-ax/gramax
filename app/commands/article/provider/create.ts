import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import ArticleProps from "@core-ui/ContextServices/ArticleProps";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import ArticleProvider, { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { JSONContent } from "@tiptap/core";

const create: Command<
	{
		ctx: Context;
		catalogName: string;
		id: string;
		content: JSONContent;
		props: ArticleProps;
		type: ArticleProviderType;
	},
	void
> = Command.create({
	path: "article/provider/create",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	kind: ResponseKind.none,

	async do({ ctx, catalogName, id, content, props, type }) {
		const { wm, formatter, parserContextFactory, parser } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;

		const provider = ArticleProvider.getProvider(catalog, type);
		await provider.create(id, content, formatter, parserContextFactory, parser, ctx, props);
	},

	params(ctx, q, body) {
		const id = q.id;
		const type = q.type as ArticleProviderType;
		const props = body?.props || {};
		const content = body?.content || {
			type: "doc",
			content: [{ type: "paragraph", content: [] }],
		};
		return { ctx, catalogName: q.catalogName, id, content, props, type };
	},
});

export default create;
