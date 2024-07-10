import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { IconEditorProps } from "@ext/markdown/elements/icon/logic/IconProvider";

const getListIcons: Command<{ catalogName: string }, IconEditorProps[]> = Command.create({
	path: "elements/icon/getIconsList",

	kind: ResponseKind.json,

	middlewares: [],

	async do({ catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog) return;
		return catalog.iconProvider.getIconsList();
	},

	params(_, q) {
		return { catalogName: q.catalogName };
	},
});

export default getListIcons;
