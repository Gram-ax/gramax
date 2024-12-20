import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import SnippetEditData from "@ext/markdown/elements/snippet/model/SnippetEditData";

const edit: Command<{ ctx: Context; oldSnippetId: string; snippetEditData: SnippetEditData; catalogName: string }, void> =
	Command.create({
		path: "elements/snippet/edit",

		kind: ResponseKind.none,

		middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, oldSnippetId, snippetEditData, catalogName }) {
			const { wm, formatter } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return;
			return catalog.snippetProvider.edit(oldSnippetId, snippetEditData, formatter);
		},

		params(ctx, q, body) {
			const catalogName = q.catalogName;
			const oldSnippetId = q.oldSnippetId;
			return { ctx, catalogName, oldSnippetId, snippetEditData: body };
		},
	});

export default edit;
