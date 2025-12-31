import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import assert from "assert";

const deleteMr: Command<{ catalogName: string; ctx: Context }, void> = Command.create({
	path: "mergeRequests/deleteMr",

	kind: ResponseKind.none,

	async do({ catalogName }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		assert(catalog?.repo.storage);

		const storage = catalog.repo.storage as GitStorage;
		if (!isGitSourceType(await storage.getType())) return;

		await catalog.repo.mergeRequests.delete();
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		return { catalogName, mr: body, ctx };
	},
});

export default deleteMr;
