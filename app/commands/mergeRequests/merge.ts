import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import assert from "assert";

const merge: Command<{ catalogName: string; ctx: Context; targetBranch: string; deleteAfterMerge: boolean }, void> =
	Command.create({
		path: "mergeRequests/merge",

		kind: ResponseKind.none,

		middlewares: [new DesktopModeMiddleware()],

		async do({ catalogName, ctx, targetBranch, deleteAfterMerge }) {
			const workspace = this._app.wm.current();
			const catalog = await workspace.getContextlessCatalog(catalogName);
			const vc = catalog?.repo?.gvc;
			if (!vc) return;

			const branch = await vc.getCurrentBranch();

			const mr = await catalog.repo.mergeRequests.findBySource(branch.toString());
			assert(mr, `no merge request found at ${branch.toString()}`);

			const userInfo = this._app.rp.getSourceData(ctx.cookie, await catalog.repo.storage.getSourceName());

			if (mr.author.email !== userInfo?.userEmail)
				throw new DefaultError("You are not the author of this merge request or storage is not connected");

			await catalog.repo.validateMerge();
			const { archiveFileName } = await catalog.repo.mergeRequests.archive(branch.toString());
			await this._commands.storage.publish.do({
				ctx,
				catalogName,
				message: `Move 'open.yaml' to 'archive/${archiveFileName}'`,
			});

			const mergeData = await this._commands.versionControl.branch.mergeInto.do({
				ctx,
				catalogName,
				branchName: targetBranch,
				deleteAfterMerge,
				validateMerge: false,
			});
			if (!mergeData.ok) {
				await this._commands.versionControl.mergeConflict.abort.do({ ctx, catalogName });
				throw new DefaultError("Can't merge with conflicts");
			}
		},

		params(ctx, q) {
			return {
				catalogName: q.catalogName,
				targetBranch: q.targetBranch,
				deleteAfterMerge: q.deleteAfterMerge === "true",
				ctx,
			};
		},
	});

export default merge;
