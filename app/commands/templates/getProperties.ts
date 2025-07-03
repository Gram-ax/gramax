import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import type Context from "@core/Context/Context";
import { Property } from "@ext/properties/models";

const getProperties: Command<
	{
		ctx: Context;
		catalogName: string;
		id: string;
	},
	Property[]
> = Command.create({
	path: "templates/getProperties",

	middlewares: [new AuthorizeMiddleware()],

	kind: ResponseKind.json,

	async do({ ctx, catalogName, id }) {
		const { wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;

		const provider = catalog.customProviders.templateProvider;
		const properties = provider.getProperties(id);
		return properties;
	},

	params(ctx, q) {
		const id = q.templateId;
		return { ctx, catalogName: q.catalogName, id };
	},
});

export default getProperties;
