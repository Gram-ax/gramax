import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import BranchData from "@ext/VersionControl/model/branch/BranchData";
import { Command } from "../../../types/Command";

const get: Command<{ catalogName: string; cached: boolean; onlyName: boolean }, BranchData> = Command.create({
	path: "versionControl/branch/get",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, cached, onlyName }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const vc = catalog?.repo.gvc;
		if (!vc) return;
		return onlyName
			? { name: await vc.getCurrentBranchName(cached) }
			: (await vc.getCurrentBranch(cached)).getData();
	},

	params(_, q) {
		return { catalogName: q.catalogName, cached: q.cached === "true", onlyName: q.onlyName === "true" };
	},
});

export default get;
