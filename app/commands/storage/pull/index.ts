import MergeType from "../../../../core/extensions/git/actions/MergeConflictHandler/model/MergeType";
import GitError from "../../../../core/extensions/git/core/GitRepository/errors/GitError";
import GitErrorCode from "../../../../core/extensions/git/core/GitRepository/errors/model/GitErrorCode";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../../core/logic/Context/Context";
import { Command, ResponseKind } from "../../../types/Command";

const pull: Command<{ ctx: Context; catalogName: string; recursive?: boolean }, void> = Command.create({
	path: "storage/pull",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName, recursive }) {
		const { lib, sp } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog.getStorage();
		if (!storage) return;

		const vc = await catalog.getVersionControl();

		const oldVersion = await vc.getCurrentVersion();

		try {
			await storage.pull(sp.getSourceData(ctx.cookie, await storage.getSourceName()), recursive);
		} catch (error) {
			const e = error as GitError;
			if (
				e.props?.errorCode === GitErrorCode.MergeConflictError ||
				e.props?.errorCode === GitErrorCode.MergeNotSupportedError
			) {
				e.setProps({ mergeType: MergeType.Sync });
			}
			throw e;
		}

		await vc.update();

		const newVersion = await vc.getCurrentVersion();
		await vc.checkChanges(oldVersion, newVersion);
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName, recursive: q.recursive === "true" };
	},
});

export default pull;
