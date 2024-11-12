import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { Command } from "../../../types/Command";
import CatalogProperty from "@ext/properties/logic/catalogProperty";

const update: Command<
	{ propertyName: string; newValue: string; catalogName: string; articlePath: string; ctx: Context },
	void
> = Command.create({
	path: "article/property/update",

	kind: ResponseKind.none,

	middlewares: [new ReloadConfirmMiddleware()],

	async do({ catalogName, newValue, articlePath, propertyName, ctx }) {
		const { wm, resourceUpdaterFactory } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog) return;
		await new CatalogProperty(catalog, ctx, resourceUpdaterFactory).update(articlePath, propertyName, newValue);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = q.articlePath;
		const propertyName = q.propertyName;
		const newValue = q.newValue;
		return { ctx, catalogName, articlePath, propertyName, newValue };
	},
});

export default update;
