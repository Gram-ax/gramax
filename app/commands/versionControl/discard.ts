import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import getParentPathname from "@core/utils/getParentPathname";
import { Command } from "../../types/Command";

const discard: Command<{ catalogName: string; filePaths: string[]; articlePath: Path }, string> = Command.create({
	path: "versionControl/discard",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, filePaths, articlePath }) {
		const { logger, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return;

		const redirectPath = articlePath.value ? await getParentPathname(catalog, articlePath) : "";

		await catalog.repo.gvc.discard(filePaths.map((path) => new Path(path)));

		logger.logTrace(
			`Discarded in catalog: ${catalog.name}. Files: "${filePaths ? `${filePaths.join('", "')}"` : "."}`,
		);

		return redirectPath;
	},

	params(_, q, body) {
		return {
			catalogName: q.catalogName,
			filePaths: body as string[],
			articlePath: new Path(q.articlePath),
		};
	},
});

export default discard;
