import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import SnippetEditorProps from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema";

const getListData: Command<{ ctx: Context; catalogName: string }, SnippetEditorProps[]> = Command.create({
	path: "elements/snippet/getListData",

	kind: ResponseKind.json,

	middlewares: [],

	async do({ ctx, catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		return catalog.snippetProvider.getListData();
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default getListData;
