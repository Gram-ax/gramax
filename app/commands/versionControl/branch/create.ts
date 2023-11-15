import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { Command, ResponseKind } from "../../../types/Command";

const create: Command<{ catalogName: string; branch: string }, void> = Command.create({
	path: "versionControl/branch/create",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, branch }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const vc = await catalog.getVersionControl();
		await vc.createNewBranch(branch);
	},

	params(ctx, q) {
		const branch = q.branch;
		const catalogName = q.catalogName;
		return { ctx, branch, catalogName };
	},
});

export default create;
