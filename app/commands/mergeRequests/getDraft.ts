import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import { Command } from "../../types/Command";

const get: Command<{ catalogName: string }, MergeRequest> = Command.create({
	path: "mergeRequests/getDraft",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		const vc = catalog?.repo?.gvc;
		if (!vc) return;

		return catalog.repo.mergeRequests.tryGetDraft();
	},

	params(_, q) {
		return { catalogName: q.catalogName };
	},
});

export default get;
