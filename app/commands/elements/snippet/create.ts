import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import SnippetEditData from "@ext/markdown/elements/snippet/model/SnippetEditData";

const create: Command<{ catalogName: string; snippetEditData: SnippetEditData }, void> = Command.create({
	path: "elements/snippet/create",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, snippetEditData }) {
		const { formatter, lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		return catalog.snippetProvider.create(snippetEditData, formatter);
	},

	params(_, q, body) {
		const catalogName = q.catalogName;
		return { catalogName, snippetEditData: body };
	},
});

export default create;
