import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import SnippetEditData from "@ext/markdown/elements/snippet/model/SnippetEditData";

const getEditData: Command<{ ctx: Context; snippetId: string; catalogName: string }, SnippetEditData> = Command.create({
	path: "elements/snippet/getEditData",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, snippetId, catalogName }) {
		const { wm, parser } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		return catalog.snippetProvider.getEditData(snippetId, parser);
	},

	params(ctx, q) {
		const snippetId = q.snippetId;
		const catalogName = q.catalogName;
		return { ctx, snippetId, catalogName };
	},
});

export default getEditData;
