import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import CatalogProperty from "@ext/properties/logic/catalogProperty";

const update: Command<
	{
		propertyName: string;
		newValue: string;
		catalogName: string;
		articlePath: Path;
		ctx: Context;
		isDelete?: boolean;
	},
	void
> = Command.create({
	path: "article/property/update",

	kind: ResponseKind.none,

	middlewares: [new ReloadConfirmMiddleware()],

	async do({ isDelete, catalogName, newValue, articlePath, propertyName, ctx }) {
		const { wm, resourceUpdaterFactory } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		await new CatalogProperty(catalog, resourceUpdaterFactory).update(
			articlePath,
			propertyName,
			newValue,
			isDelete,
		);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		const propertyName = q.propertyName;
		const newValue = q.newValue;
		const isDelete = q.isDelete === "true";
		return { ctx, catalogName, articlePath, propertyName, newValue, isDelete };
	},
});

export default update;
