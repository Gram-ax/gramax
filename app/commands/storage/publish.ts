import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import initReviewers from "@ext/enterprise/utils/initReviewers";
import { Command } from "../../types/Command";

const publish: Command<
	{ ctx: Context; catalogName: string; message: string; filePaths?: string[]; recursive?: boolean },
	void
> = Command.create({
	path: "storage/publish",

	kind: ResponseKind.none,

	middlewares: [new NetworkConnectMiddleWare(), new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, message, filePaths }) {
		const { logger, rp, wm, em } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog.repo.storage;
		if (!storage) return;
		const data = rp.getSourceData(ctx.cookie, await storage.getSourceName());
		const isCreated = await catalog.repo.mergeRequests.isCreated();
		await catalog.repo.publish({
			commitMessage: message,
			filesToPublish: filePaths?.map((p) => new Path(p)),
			data,
			onAdd: () =>
				logger.logTrace(
					`Added in catalog "${catalogName}". Files: "${
						filePaths ? filePaths.map((p) => p).join('", "') : "*"
					}"`,
				),
			onCommit: () => logger.logTrace(`Commited in catalog "${catalogName}". Message: "${message}"`),
			onPush: async () => {
				logger.logInfo(`Pushed in catalog "${catalogName}".`);
				if (!isCreated) return;
				const branch = await catalog.repo.gvc.getCurrentBranchName();
				const mr = await catalog.repo.mergeRequests.findBySource(branch, false);
				if (!mr) return;
				await initReviewers(em?.getConfig()?.gesUrl, data, storage, mr.approvers, branch);
			},
		});
	},

	params(ctx, q, body) {
		return {
			ctx,
			message: q.commitMessage,
			catalogName: q.catalogName,
			filePaths: body as string[],
		};
	},
});

export default publish;
