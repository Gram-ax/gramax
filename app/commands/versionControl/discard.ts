import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Command, ResponseKind } from "../../types/Command";

const discard: Command<{ catalogName: string; filePaths: string[] }, void> = Command.create({
	path: "versionControl/discard",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, filePaths }) {
		const { rp, lib, logger } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;

		await catalog.repo.gvc.discard(filePaths.map((filePath) => new Path(filePath)));
		await catalog.update(rp);
		logger.logTrace(
			`Discarded in catalog: ${catalog.getName()}. Files: "${filePaths ? filePaths.join('", "') + '"' : "."}`,
		);
	},

	params(ctx, q, body) {
		return { ctx, catalogName: q.catalogName, filePaths: body as string[] };
	},
});

export default discard;
