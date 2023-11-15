import VersionControlType from "../../../../core/extensions/VersionControl/model/VersionControlType";
import MergeType from "../../../../core/extensions/git/actions/MergeConflictHandler/model/MergeType";
import GitError from "../../../../core/extensions/git/core/GitRepository/errors/GitError";
import GitErrorCode from "../../../../core/extensions/git/core/GitRepository/errors/model/GitErrorCode";
import GitStorage from "../../../../core/extensions/git/core/GitStorage/GitStorage";
import GitVersionControl from "../../../../core/extensions/git/core/GitVersionControl/GitVersionControl";
import GitSourceData from "../../../../core/extensions/git/core/model/GitSourceData.schema";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../../core/logic/Context/Context";
import { Command, ResponseKind } from "../../../types/Command";

const mergeInto: Command<{ ctx: Context; catalogName: string; branchName: string; deleteAfterMerge: boolean }, void> =
	Command.create({
		path: "versionControl/branch/mergeInto",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware()],

		async do({ ctx, catalogName, branchName, deleteAfterMerge }) {
			const { lib, sp } = this._app;
			const catalog = await lib.getCatalog(catalogName);
			if (!catalog) return;
			const vc = await catalog.getVersionControl();
			if (vc.getType() !== VersionControlType.git) return;

			const gvc = vc as GitVersionControl;
			const storage = catalog.getStorage() as GitStorage;
			const sourceData = sp.getSourceData(ctx.cookie, await storage.getSourceName()) as GitSourceData;
			const branchBefore = await gvc.getCurrentBranch();

			await this._commands.versionControl.branch.checkout.do({
				branch: branchName,
				catalogName,
				ctx,
			});
			const headBeforeMerge = await gvc.getCurrentVersion();

			const abortMerge = async () => {
				await this._commands.versionControl.branch.mergeConflict.abort.do({
					theirsBranch: branchBefore.toString(),
					catalogName,
					headBeforeMerge: headBeforeMerge.toString(),
				});
			};

			try {
				await gvc.mergeBranch(sourceData, branchBefore);
			} catch (error) {
				const e: GitError = error;
				const errorCode = e.props.errorCode;
				e.setProps({ mergeType: MergeType.Branches, fromMerge: true });
				if (errorCode !== GitErrorCode.MergeConflictError) await abortMerge();
				throw e;
			}

			try {
				if (deleteAfterMerge) {
					const remoteBranchName = branchBefore.getData().remoteName;
					if (remoteBranchName) {
						await storage.deleteRemoteBranch(remoteBranchName, sourceData);
					}
					await gvc.deleteLocalBranch(branchBefore.getData().name);
				}
				await storage.push(sourceData);
			} catch (error) {
				const e: GitError = error;
				e.setProps({ mergeType: MergeType.Branches, fromMerge: true });
				await abortMerge();
				throw e;
			}
		},

		params(ctx, q) {
			return {
				ctx,
				deleteAfterMerge: q.deleteAfterMerge === "true",
				catalogName: encodeURIComponent(q.catalogName),
				branchName: encodeURIComponent(q.branchName),
			};
		},
	});

export default mergeInto;
