import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { CreateMergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";

const create: Command<{ catalogName: string; mr: CreateMergeRequest; ctx: Context }, void> = Command.create({
	path: "mergeRequests/create",

	kind: ResponseKind.none,

	async do({ catalogName, mr, ctx }) {
		const { wm, rp } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog?.repo.storage) return;

		const storage = catalog.repo.storage as GitStorage;
		if (!isGitSourceType(await storage.getType())) return;

		const sourceData = rp.getSourceData(ctx, await storage.getSourceName()) as GitSourceData;
		if (mr) mr.forceCreate = true;

		await catalog.repo.mergeRequests.create(sourceData, mr);
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		return { catalogName, mr: body, ctx };
	},
});

export default create;
