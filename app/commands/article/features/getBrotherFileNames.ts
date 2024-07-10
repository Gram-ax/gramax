import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Command } from "../../../types/Command";

const getBrotherFileNames: Command<{ path: Path; catalogName: string }, string[]> = Command.create({
	path: "article/features/getBrotherFileNames",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ catalogName, path }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName);
		const fp = workspace.getFileProvider();
		const itemRef = fp.getItemRef(path);
		const article = catalog.findItemByItemRef(itemRef);
		const fileNames = article
			? article.parent.items
					.filter((i) => !(i.getFileName() === article.getFileName()))
					.map((i) => i.getFileName())
			: null;
		return fileNames;
	},

	params(ctx, q) {
		const path = new Path(q.path);
		const catalogName = q.catalogName;
		return { ctx, path, catalogName };
	},
});

export default getBrotherFileNames;
