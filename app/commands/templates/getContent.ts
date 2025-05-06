import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import { JSONContent } from "@tiptap/core";

const getContent: Command<
	{
		ctx: Context;
		catalogName: string;
		id: string;
	},
	JSONContent
> = Command.create({
	path: "templates/getContent",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	kind: ResponseKind.json,

	async do({ ctx, catalogName, id }) {
		const { wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;

		const provider = catalog.templateProvider;
		const content = await provider.getEditTree(id, parser, parserContextFactory, ctx);
		return content;
	},

	params(ctx, q) {
		const id = q.templateId;
		return { ctx, catalogName: q.catalogName, id };
	},
});

export default getContent;
