import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { Command, ResponseKind } from "../../../types/Command";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";

const create: Command<{ catalogName: string; branch: string }, string> = Command.create({
	path: "versionControl/branch/create",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, branch }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const vc = catalog.repo.gvc;
		await vc.createNewBranch(branch);
		return await catalog.getPathname();
	},

	params(ctx, q) {
		const branch = q.branch;
		const catalogName = q.catalogName;
		return { ctx, branch, catalogName };
	},
});

export default create;
