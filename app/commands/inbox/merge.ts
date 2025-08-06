import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { InboxArticle } from "@ext/inbox/models/types";
import { Command } from "../../types/Command";

const create: Command<
	{ catalogName: string; ctx: Context; draggedLogicPath: string; droppedLogicPath: string },
	InboxArticle
> = Command.create({
	path: "inbox/merge",

	kind: ResponseKind.json,

	async do({ catalogName, ctx, draggedLogicPath, droppedLogicPath }) {
		const { wm, parserContextFactory, parser } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const inbox = catalog.customProviders.inboxProvider;
		const newNote = await inbox.mergeArticles(
			draggedLogicPath,
			droppedLogicPath,
			parser,
			parserContextFactory,
			ctx,
		);
		return inbox.createInboxArticle(newNote);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const draggedLogicPath = q.draggedLogicPath;
		const droppedLogicPath = q.droppedLogicPath;
		return { ctx, catalogName, draggedLogicPath, droppedLogicPath };
	},
});

export default create;
