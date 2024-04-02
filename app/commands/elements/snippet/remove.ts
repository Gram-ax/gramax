import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";

const remove: Command<{ catalogName: string; snippetId: string }, void> = Command.create({
	path: "elements/snippet/remove",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, snippetId }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		return catalog.snippetProvider.remove(snippetId);
	},

	params(_, q) {
		return { catalogName: q.catalogName, snippetId: q.snippetId };
	},
});

export default remove;
