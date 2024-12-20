import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { Command } from "../../../types/Command";
import CatalogProperty from "@ext/properties/logic/catalogProperty";
import Path from "@core/FileProvider/Path/Path";
import { PropertyUsage } from "@ext/properties/models";

const get: Command<
	{ articlePath: Path; propertyName: string; values: string[]; catalogName: string; ctx: Context },
	PropertyUsage[]
> = Command.create({
	path: "article/property/get",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ articlePath, catalogName, values, propertyName, ctx }) {
		const { wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		return await new CatalogProperty(catalog).getUsages(articlePath, propertyName, values);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		const propertyName = q.propertyName;
		const values = q.value && q.value.split(",");
		return { ctx, catalogName, articlePath, propertyName, values };
	},
});

export default get;
