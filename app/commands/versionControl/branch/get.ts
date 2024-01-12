import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import BranchData from "@ext/VersionControl/model/branch/BranchData";
import { Command, ResponseKind } from "../../../types/Command";

const get: Command<{ catalogName: string }, BranchData> = Command.create({
	path: "versionControl/branch/get",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const vc = catalog.repo.gvc;
		return (await vc.getCurrentBranch()).getData();
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default get;
