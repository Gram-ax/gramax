import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Command } from "../../types/Command";

const discard: Command<{ catalogName: string; filePaths: string[] }, void> = Command.create({
	path: "versionControl/discard",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, filePaths }) {
		const { logger, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog) return;

		await catalog.repo.gvc.discard(filePaths.map((filePath) => new Path(filePath)));
		logger.logTrace(
			`Discarded in catalog: ${catalog.getName()}. Files: "${filePaths ? filePaths.join('", "') + '"' : "."}`,
		);
	},

	params(ctx, q, body) {
		return { ctx, catalogName: q.catalogName, filePaths: body as string[] };
	},
});

export default discard;
