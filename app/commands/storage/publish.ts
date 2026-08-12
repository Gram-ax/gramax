import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { NetworkConnectMiddleware } from "@core/Api/middleware/NetworkConnectMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { getWorkspaceGesUrl } from "@ext/enterprise/utils/getWorkspaceEnterpriseConfig";
import initReviewers from "@ext/enterprise/utils/initReviewers";
import { addEvent, Level } from "@ext/loggers/opentelemetry";
import PublishHealthcheckMiddleware from "../../../core/extensions/enterprise/middleware/PublishHealthcheckMiddleware";
import { Command } from "../../types/Command";

const publish: Command<
	{ ctx: Context; catalogName: string; message: string; filePaths?: string[]; recursive?: boolean },
	void
> = Command.create({
	path: "storage/publish",

	kind: ResponseKind.none,

	middlewares: [
		new NetworkConnectMiddleware(),
		new AuthorizeMiddleware(),
		new ReloadConfirmMiddleware(),
		new PublishHealthcheckMiddleware(),
	],

	async do({ ctx, catalogName, message, filePaths }) {
		const { rp, wm } = this._app;
		const workspace = wm.current();
		const workspaceConfig = await workspace.config();
		const gesUrl = getWorkspaceGesUrl(workspaceConfig);

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return;

		const storage = catalog.repo.storage;
		if (!storage) return;

		const data = rp.getSourceData(ctx, await storage.getSourceName());
		const isCreated = await catalog.repo.mergeRequests.isCreated();
		await catalog.repo.publish({
			commitMessage: message,
			filesToPublish: filePaths?.map((p) => new Path(p)),
			data,
			onAdd: () => addEvent("add", Level.Important, { paths: filePaths }),
			onCommit: () => addEvent("commit", Level.Important, { message }),
			onPush: async () => {
				addEvent("push", Level.Important, { message });

				await catalog.repo.gc({
					looseObjectsLimit: 600,
				});

				if (!isCreated) return;
				const branch = await catalog.repo.gvc.getCurrentBranchName();
				const mr = await catalog.repo.mergeRequests.findBySource(branch, false);
				if (!mr) return;
				addEvent("initReviewers", Level.Important, { approvers: JSON.stringify(mr.approvers), branch });
				await initReviewers(gesUrl, data, storage, mr.approvers, branch);
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
