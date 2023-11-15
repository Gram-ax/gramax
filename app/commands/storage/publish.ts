import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Command, ResponseKind } from "../../types/Command";

const publish: Command<
	{ ctx: Context; catalogName: string; message: string; filePaths: string[]; recursive?: boolean },
	void
> = Command.create({
	path: "storage/publish",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName, message, filePaths, recursive }) {
		const { lib, logger, sp } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog.getStorage();
		const data = sp.getSourceData(ctx.cookie, await storage.getSourceName());
		if (!storage) return;
		const versionControl = await catalog.getVersionControl();

		await versionControl.add(filePaths.map((p) => new Path(p)));
		await versionControl.commit(message, data);

		try {
			await storage.push(data, recursive);
		} catch (e) {
			await versionControl.restoreRepositoryState();
			throw e;
		}
		logger.logTrace(`Pushed to catalog "${catalogName}". Files: "${filePaths.map((p) => p).join('", "')}"`);
	},

	params(ctx, q, body) {
		return {
			ctx,
			message: q.commitMessage,
			catalogName: q.catalogName,
			recursive: q.recursive === "true",
			filePaths: body as string[],
		};
	},
});

export default publish;
