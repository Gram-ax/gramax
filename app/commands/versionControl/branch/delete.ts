import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import GitError from "@ext/git/core/GitCommands/errors/GitError";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import assert from "assert";
import { Command } from "../../../types/Command";

const deleteBranch: Command<{ ctx: Context; catalogName: string; branch: string }, void> = Command.create({
	path: "versionControl/branch/delete",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, branch }) {
		const { rp, wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		assert(catalog, `'${catalogName}' doesn't exist`);

		const storage = catalog.repo.storage as GitStorage;

		const storageType = await storage?.getType();

		assert(
			isGitSourceType(storageType),
			`'${catalogName}' doesn't have a git storage (actual: ${storageType || null})`,
		);

		const sourceData = rp.getSourceData<GitSourceData>(ctx, await storage.getSourceName());

		let remoteErr = null;
		try {
			await storage.deleteRemoteBranch(branch, sourceData);
		} catch (e) {
			remoteErr = e;
			// if the branch doesn't exist remotely, it's ok to ignore the error
			if (!(e instanceof GitError && e.props.errorCode == GitErrorCode.NotFoundError)) throw e;
		}

		const vc = catalog.repo.gvc;
		assert(vc, `expected '${catalogName}' to have a gvc but got ${vc}`);

		let localErr = null;
		try {
			await vc.deleteLocalBranch(branch);
		} catch (e) {
			localErr = e;
			// if the branch doesn't exist locally, it's ok to ignore the error
			if (!(e instanceof GitError && e.props.errorCode == GitErrorCode.NotFoundError)) throw e;
		}

		assert(
			!localErr || !remoteErr,
			`Failed to delete branch '${branch}' in '${catalogName}': got errors from both local and remote removal:\nlocal: ${localErr}\nremote: ${remoteErr}`,
		);
	},

	params(ctx, q) {
		const branch = q.branch;
		const catalogName = q.catalogName;
		return { ctx, branch, catalogName };
	},
});

export default deleteBranch;
