import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import SnippetEditData from "@ext/markdown/elements/snippet/model/SnippetEditData";

const create: Command<{ ctx: Context; catalogName: string; snippetEditData: SnippetEditData }, void> = Command.create({
	path: "elements/snippet/create",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, snippetEditData }) {
		const { wm, formatter } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		return catalog.snippetProvider.create(snippetEditData, formatter);
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		return { ctx, catalogName, snippetEditData: body };
	},
});

export default create;
