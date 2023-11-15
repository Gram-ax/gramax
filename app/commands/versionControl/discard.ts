import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Command, ResponseKind } from "../../types/Command";

const discard: Command<{ catalogName: string; filePaths: string[] }, void> = Command.create({
	path: "versionControl/discard",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, filePaths }) {
		const { sp, lib, vcp, logger } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;

		await (await catalog.getVersionControl()).discard(filePaths.map((filePath) => new Path(filePath)));
		await catalog.update(sp, vcp);
		logger.logTrace(
			`Discarded in catalog: ${catalog.getName()}. Files: "${filePaths ? filePaths.join('", "') + '"' : "."}`,
		);
	},

	params(ctx, q, body) {
		return { ctx, catalogName: q.catalogName, filePaths: body as string[] };
	},
});

export default discard;
