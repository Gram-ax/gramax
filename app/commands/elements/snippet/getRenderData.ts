import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import SnippetRenderData from "@ext/markdown/elements/snippet/model/SnippetRenderData";

const getRenderData: Command<{ snippetId: string; catalogName: string }, SnippetRenderData> = Command.create({
	path: "elements/snippet/getRenderData",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ snippetId, catalogName }) {
		const { lib, parser } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		return catalog.snippetProvider.getRenderData(snippetId, parser);
	},

	params(_, q) {
		const snippetId = q.snippetId;
		const catalogName = q.catalogName;
		return { snippetId, catalogName };
	},
});

export default getRenderData;
