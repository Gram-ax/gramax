import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import SnippetEditorProps from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema";

const getListData: Command<{ catalogName: string }, SnippetEditorProps[]> = Command.create({
	path: "elements/snippet/getListData",

	kind: ResponseKind.json,

	middlewares: [],

	async do({ catalogName }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		return catalog.snippetProvider.getListData();
	},

	params(_, q) {
		return { catalogName: q.catalogName };
	},
});

export default getListData;
