import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import getCatalogNameWithoutCommitOid from "@ext/git/actions/Revisions/logic/utils/getCatalogNameWithoutCommitOid";
import assert from "assert";

const getRevisions: Command<{ catalogName: string; commitOid: string }, string> = Command.create({
	path: "versionControl/revision/getRevisionPathname",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, commitOid }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalogNameWithoutCommitOid = getCatalogNameWithoutCommitOid(catalogName);
		const catalog = await workspace.getContextlessCatalog(catalogNameWithoutCommitOid);
		assert(catalog?.repo?.gvc);

		const headCommit = await catalog.repo.gvc.getHeadCommit();
		if (headCommit.toString() === commitOid) return await catalog.getPathname();

		const scopedCatalog = await catalog.repo.scopedCatalogs.getScopedCatalog(
			catalog.basePath,
			workspace.getFileStructure(),
			{ commit: commitOid },
		);

		assert(scopedCatalog);

		return await scopedCatalog.getPathname();
	},

	params(ctx, q) {
		const commitOid = q.commitOid as string;
		return { ctx, catalogName: q.catalogName as string, commitOid };
	},
});

export default getRevisions;
