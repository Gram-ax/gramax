import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";
import { TemplateProps } from "@ext/templates/models/types";

const get: Command<{ catalogName: string; ctx: Context }, TemplateProps[]> = Command.create({
	path: "templates/get",

	kind: ResponseKind.json,

	async do({ catalogName, ctx }) {
		const { wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const templateProvider = catalog.templateProvider;

		return await templateProvider.getTemplates(parser, parserContextFactory, ctx);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default get;
