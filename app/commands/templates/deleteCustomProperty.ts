import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";

const deleteCustomProperty: Command<
	{
		ctx: Context;
		catalogName: string;
		propertyName: string;
		id: string;
	},
	void
> = Command.create({
	path: "templates/deleteCustomProperty",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	kind: ResponseKind.none,

	async do({ ctx, catalogName, id, propertyName }) {
		const { wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;

		const provider = catalog.customProviders.templateProvider;
		await provider.deleteCustomProperty(id, propertyName);
	},

	params(ctx, q) {
		const id = q.templateId;
		const propertyName = q.propertyName;
		return { ctx, catalogName: q.catalogName, id, propertyName };
	},
});

export default deleteCustomProperty;
