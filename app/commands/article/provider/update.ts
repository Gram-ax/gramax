import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import ArticleProps from "@core-ui/ContextServices/ArticleProps";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import ArticleProvider, { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import type { JSONContent } from "@tiptap/react";

const update: Command<
	{
		ctx: Context;
		catalogName: string;
		id: string;
		editTree: JSONContent;
		content: string;
		props: ArticleProps;
		type: ArticleProviderType;
	},
	void
> = Command.create({
	path: "article/provider/update",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	kind: ResponseKind.none,

	async do({ ctx, catalogName, id, editTree, content, props, type }) {
		const { wm, formatter, parser, parserContextFactory, resourceUpdaterFactory } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;

		const provider = ArticleProvider.getProvider(catalog, type);
		if (editTree) await provider.updateContent(id, editTree, formatter, parserContextFactory, parser, ctx);
		if (content) {
			const editTree = await provider.getEditTreeFromContent(id, content, parser, parserContextFactory, ctx);
			await provider.updateContent(id, editTree, formatter, parserContextFactory, parser, ctx);
		}
		if (props) await provider.updateProps(id, resourceUpdaterFactory, props);
	},

	params(ctx, q, body) {
		const editTree = body?.editTree as JSONContent;
		const props = body?.props as ArticleProps;
		const id = q.id;
		const type = q.type as ArticleProviderType;
		return { ctx, catalogName: q.catalogName, id, editTree, content: body?.content, props, type };
	},
});

export default update;
