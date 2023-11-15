import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import LinkItemCreator from "@ext/artilce/LinkCreator/logic/LinkItemCreator";
import LinkItem from "@ext/artilce/LinkCreator/models/LinkItem";
import { Command, ResponseKind } from "../../../types/Command";

const getLinkItems: Command<{ path: Path; catalogName: string }, LinkItem[]> = Command.create({
	path: "article/features/getLinkItems",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ catalogName, path }) {
		const { lib } = this._app;
		if (!catalogName) return;
		const catalog = await lib.getCatalog(catalogName);
		const linkCreator = new LinkItemCreator(catalog);
		return linkCreator.getLinkItems(path);
	},

	params(ctx, q) {
		const path = new Path(q.path);
		const catalogName = q.catalogName;
		return { ctx, path, catalogName };
	},
});

export default getLinkItems;
