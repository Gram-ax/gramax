import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "../../../../core/logic/Api/middleware/AuthorizeMiddleware";
import { Command } from "../../../types/Command";

const validateMerge: Command<{ catalogName: string }, void> = Command.create({
	path: "versionControl/mergeConflict/validateMerge",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog || !catalog.repo.storage) return;
		await catalog.repo.validateMerge();
	},

	params(_, q) {
		const catalogName = q.catalogName;
		return { catalogName };
	},
});

export default validateMerge;
