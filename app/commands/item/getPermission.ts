import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Command, ResponseKind } from "../../types/Command";

const getPermission: Command<{ catalogName: string; articlePath: Path }, string[]> = Command.create({
	path: "item/getPermission",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, articlePath }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!articlePath) return catalog.getNeededPermission().getValues();
		const item = catalog.findItemByItemPath(articlePath);
		if (item) return item.neededPermission.getValues();
		return [];
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = q.path ? new Path(q.path) : null;
		return { ctx, catalogName, articlePath };
	},
});

export default getPermission;
