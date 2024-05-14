import deleteBranchAfterMerge from "@app/commands/versionControl/branch/mergeConflict/utils/deleteBranchAfterMerge";
import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import MergeType from "../../../../core/extensions/git/actions/MergeConflictHandler/model/MergeType";
import GitError from "../../../../core/extensions/git/core/GitCommands/errors/GitError";
import GitErrorCode from "../../../../core/extensions/git/core/GitCommands/errors/model/GitErrorCode";
import GitStorage from "../../../../core/extensions/git/core/GitStorage/GitStorage";
import GitSourceData from "../../../../core/extensions/git/core/model/GitSourceData.schema";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../../core/logic/Context/Context";
import { Command } from "../../../types/Command";

const mergeInto: Command<{ ctx: Context; catalogName: string; branchName: string; deleteAfterMerge: boolean }, void> =
	Command.create({
		path: "versionControl/branch/mergeInto",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, catalogName, branchName, deleteAfterMerge }) {
			const { lib, rp } = this._app;
			const catalog = await lib.getCatalog(catalogName);
			if (!catalog) return;
			const gvc = catalog.repo.gvc;

			if ((await gvc.getChanges(false)).length > 0)
				throw new GitError(GitErrorCode.WorkingDirNotEmpty, null, { repositoryPath: gvc.getPath().value });

			const storage = catalog.repo.storage as GitStorage;
			const sourceData = rp.getSourceData(ctx.cookie, await storage.getSourceName()) as GitSourceData;
			const branchNameBefore = (await gvc.getCurrentBranch()).toString();

			await this._commands.versionControl.branch.checkout.do({
				branch: branchName,
				catalogName,
				ctx,
			});
			const headBeforeMerge = (await gvc.getCurrentVersion()).toString();

			try {
				await gvc.mergeBranch(sourceData, branchNameBefore);
			} catch (error) {
				const e: GitError = error;
				const errorCode = e.props.errorCode;
				e.setProps({
					mergeType: MergeType.Branches,
					fromMerge: true,
					deleteAfterMerge,
					branchNameBefore,
					headBeforeMerge,
				});
				if (errorCode !== GitErrorCode.MergeConflictError)
					await this._commands.versionControl.branch.mergeConflict.abort.do({
						theirsBranch: branchNameBefore,
						catalogName,
						headBeforeMerge,
					});
				throw e;
			}

			if (deleteAfterMerge) {
				await deleteBranchAfterMerge({
					commands: this._commands,
					branchNameBefore,
					headBeforeMerge,
					catalogName,
					sourceData,
					storage,
					gvc,
				});
			}

			await storage.push(sourceData);
			await catalog.update(rp);
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
