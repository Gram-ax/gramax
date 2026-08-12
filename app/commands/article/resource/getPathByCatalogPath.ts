import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { addEvent, Level } from "@ext/loggers/opentelemetry";

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
		if (!catalog) {
			addEvent("no-catalog", Level.Internal, { catalogName });
			return;
		}

		return catalog.basePath.join(path).value;
	},

	params(ctx, q) {
		const path = new Path(q.path);
		const catalogName = q.catalogName;
		return { ctx, path, catalogName };
	},
});

export default getPathByCatalogPath;
