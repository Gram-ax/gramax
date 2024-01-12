import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import BranchData from "@ext/VersionControl/model/branch/BranchData";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import { Command, ResponseKind } from "../../../types/Command";

const reset: Command<{ ctx: Context; catalogName: string }, BranchData[]> = Command.create({
	path: "versionControl/branch/reset",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName }) {
		const { lib, rp } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const storage = catalog.repo.storage;
		const data = rp.getSourceData(ctx.cookie, await storage.getSourceName()) as GitSourceData;
		if (storage) await storage.fetch(data);
		const vc = catalog.repo.gvc;
		return (await vc.resetBranches()).map((b) => b.getData());
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default reset;
