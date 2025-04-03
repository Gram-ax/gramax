import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";
import { InboxArticle } from "@ext/inbox/models/types";

const get: Command<{ catalogName: string; ctx: Context }, InboxArticle[]> = Command.create({
	path: "inbox/get",

	kind: ResponseKind.json,

	async do({ catalogName, ctx }) {
		const { wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const inbox = catalog.inboxProvider;

		return await inbox.getArticles(parser, parserContextFactory, ctx);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default get;
