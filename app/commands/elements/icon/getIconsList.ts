import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import { IconEditorProps } from "@ext/markdown/elements/icon/logic/IconProvider";

const getListIcons: Command<{ ctx: Context; catalogName: string }, IconEditorProps[]> = Command.create({
	path: "elements/icon/getIconsList",

	kind: ResponseKind.json,

	middlewares: [],

	async do({ ctx, catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		return catalog.iconProvider.getIconsList();
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default getListIcons;
