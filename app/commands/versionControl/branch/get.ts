import { ResponseKind } from "@app/types/ResponseKind";
import BranchData from "@ext/VersionControl/model/branch/BranchData";
import { Command } from "../../../types/Command";

const get: Command<
	{ catalogName: string; cached: boolean; cachedMergeRequests: boolean; onlyName: boolean },
	BranchData
> = Command.create({
	path: "versionControl/branch/get",

	kind: ResponseKind.json,

	middlewares: [],

	async do({ catalogName, cached, cachedMergeRequests, onlyName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		const vc = catalog?.repo?.gvc;
		if (!vc) return;

		if (onlyName) return { name: await vc.getCurrentBranchName(cached) };

		const branch = await vc.getCurrentBranch();
		const mergeRequest = await catalog.repo.mergeRequests.findBySource(branch.toString(), cachedMergeRequests);

		return {
			...(await vc.getCurrentBranch(cached)).getData(),
			mergeRequest,
		};
	},

	params(_, q) {
		return {
			catalogName: q.catalogName,
			cached: q.cached === "true",
			cachedMergeRequests: q.cachedMergeRequests === "true",
			onlyName: q.onlyName === "true",
		};
	},
});

export default get;
