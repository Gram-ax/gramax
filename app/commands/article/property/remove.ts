import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { Command } from "../../../types/Command";
import Path from "@core/FileProvider/Path/Path";
import { PropertyValue } from "@ext/properties/models";
import CatalogProperty from "@ext/properties/logic/catalogProperty";

const remove: Command<
	{ articlePath: Path; propertyName: string; value: string[]; catalogName: string; ctx: Context },
	PropertyValue[]
> = Command.create({
	path: "article/property/remove",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ articlePath, catalogName, value, propertyName, ctx }) {
		const { wm, resourceUpdaterFactory } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog) return;
		return await new CatalogProperty(catalog, ctx, resourceUpdaterFactory).remove(articlePath, propertyName, value);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const propertyName = q.propertyName;
		const value = q.value && q.value.split(",");
		const articlePath = new Path(q.articlePath);
		return { ctx, catalogName, propertyName, value, articlePath };
	},
});

export default remove;
