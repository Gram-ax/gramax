import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";
import { InboxArticle } from "@ext/inbox/models/types";

const get: Command<{ catalogName: string; userMail: string; ctx: Context }, InboxArticle[]> = Command.create({
	path: "inbox/get",

	kind: ResponseKind.json,

	async do({ catalogName, ctx, userMail }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const inbox = catalog.customProviders.inboxProvider;

		return await inbox.getItems(true, userMail);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const userMail = q.userMail;
		return { ctx, catalogName, userMail };
	},
});

export default get;
