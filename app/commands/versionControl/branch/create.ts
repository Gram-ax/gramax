import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import { Command } from "../../../types/Command";

const create: Command<{ catalogName: string; branch: string }, string> = Command.create({
	path: "versionControl/branch/create",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, branch }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
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
