import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";
import { TemplateItemProps } from "@ext/templates/models/types";

const get: Command<{ catalogName: string; ctx: Context }, TemplateItemProps[]> = Command.create({
	path: "templates/getList",

	kind: ResponseKind.json,

	async do({ catalogName, ctx }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const templateProvider = catalog.templateProvider;

		return await templateProvider.getTemplatesList();
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default get;
