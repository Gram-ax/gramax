import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";

const app: Command<{ catalogName: string; articlePath: Path }, string> = Command.create({
	path: "article/editOn/app",

	kind: ResponseKind.plain,

	async do({ catalogName, articlePath }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog) return;
		const item = catalog.findItemByItemPath(articlePath);
		return RouterPathProvider.getPathname(await catalog.getPathnameData(item)).value;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { ctx, catalogName, articlePath };
	},
});

export default app;
