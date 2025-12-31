import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import LinkItemCreator from "@ext/article/LinkCreator/logic/LinkItemCreator";
import type LinkItem from "@ext/article/LinkCreator/models/LinkItem";

const getLinkItemByPath: Command<{ ctx: Context; path: Path; catalogName: string }, LinkItem> = Command.create({
	path: "article/features/getLinkItemByPath",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName, path }) {
		const workspace = this._app.wm.current();
		if (!catalogName) return null;

		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return null;

		const linkItemCreator = new LinkItemCreator(ctx, catalog);
		return await linkItemCreator.getLinkItemByPath(path);
	},

	params(ctx, q) {
		const path = new Path(q.path);
		const catalogName = q.catalogName;
		return { ctx, path, catalogName };
	},
});

export default getLinkItemByPath;
