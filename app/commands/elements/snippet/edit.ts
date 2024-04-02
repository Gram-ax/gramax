import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import SnippetEditData from "@ext/markdown/elements/snippet/model/SnippetEditData";

const edit: Command<{ oldSnippetId: string; snippetEditData: SnippetEditData; catalogName: string }, void> =
	Command.create({
		path: "elements/snippet/edit",

		kind: ResponseKind.none,

		middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ oldSnippetId, snippetEditData, catalogName }) {
			const { lib, formatter } = this._app;
			const catalog = await lib.getCatalog(catalogName);
			if (!catalog) return;
			return catalog.snippetProvider.edit(oldSnippetId, snippetEditData, formatter);
		},

		params(_, q, body) {
			const catalogName = q.catalogName;
			const oldSnippetId = q.oldSnippetId;
			return { catalogName, oldSnippetId, snippetEditData: body };
		},
	});

export default edit;
