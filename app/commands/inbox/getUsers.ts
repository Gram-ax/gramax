import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const getUsers: Command<{ catalogName: string; ctx: Context }, string[]> = Command.create({
	path: "inbox/getUsers",

	kind: ResponseKind.json,

	async do({ catalogName, ctx }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const inbox = catalog.customProviders.inboxProvider;
		const users = await inbox.getInboxUsers();
		return users;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getUsers;
