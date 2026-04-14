import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import assert from "assert";

const getPathByCatalogPath: Command<
	{
		path: Path;
		ctx: Context;
		catalogName: string;
	},
	string
> = Command.create({
	path: "article/resource/getPathByCatalogPath",

	kind: ResponseKind.plain,

	async do({ path, catalogName, ctx }) {
		const { wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		assert(catalog);

		return catalog.basePath.join(path).value;
	},

	params(ctx, q) {
		const path = new Path(q.path);
		const catalogName = q.catalogName;
		return { ctx, path, catalogName };
	},
});

export default getPathByCatalogPath;
