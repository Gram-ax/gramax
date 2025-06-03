import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import { Property } from "@ext/properties/models";

const saveCustomProperty: Command<
	{
		ctx: Context;
		catalogName: string;
		property: Property;
		id: string;
	},
	void
> = Command.create({
	path: "templates/saveCustomProperty",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	kind: ResponseKind.none,

	async do({ ctx, catalogName, id, property }) {
		const { wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;

		const provider = catalog.customProviders.templateProvider;
		await provider.saveCustomProperty(id, property);
	},

	params(ctx, q, body) {
		const id = q.templateId;
		const property = body;
		return { ctx, catalogName: q.catalogName, id, property };
	},
});

export default saveCustomProperty;
