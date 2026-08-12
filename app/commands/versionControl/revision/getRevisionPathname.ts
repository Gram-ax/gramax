import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import { getArticlePathWithoutCommitOid } from "@ext/git/actions/Revisions/logic/utils/getArticlePathWithoutCommitOid";
import getCatalogNameWithoutCommitOid from "@ext/git/actions/Revisions/logic/utils/getCatalogNameWithoutCommitOid";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import assert from "assert";

const getRevisions: Command<
	{ catalogName: string; commitOid: string; articlePath: string; oldCommitOid?: string },
	string
> = Command.create({
	path: "versionControl/revision/getRevisionPathname",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, commitOid, articlePath, oldCommitOid }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalogNameWithoutCommitOid = getCatalogNameWithoutCommitOid(catalogName);
		const articlePathWithoutCommitOid = getArticlePathWithoutCommitOid(articlePath);
		const catalog = await workspace.getContextlessCatalog(catalogNameWithoutCommitOid);
		assert(catalog?.repo?.gvc);

		const headCommit = await catalog.repo.gvc.getHeadCommit();
		if (headCommit.toString() === commitOid && !oldCommitOid) {
			const item = catalog.findItemByItemPath(new Path(articlePathWithoutCommitOid));
			return await catalog.getPathname(item);
		}

		const scope: TreeReadScope = oldCommitOid
			? { oldCommit: { commit: oldCommitOid }, newCommit: { commit: commitOid } }
			: { commit: commitOid };

		const scopedCatalog = await catalog.repo.scopedCatalogs.getScopedCatalog(
			catalog.basePath,
			workspace.getFileStructure(),
			scope,
		);

		assert(scopedCatalog);

		const articleScopedPath = GitTreeFileProvider.scoped(new Path(articlePathWithoutCommitOid), scope);
		const scopedArticle = scopedCatalog.findItemByItemPath<Article>(articleScopedPath);
		return await scopedCatalog.getPathname(scopedArticle);
	},

	params(ctx, q) {
		const commitOid = q.commitOid;
		const articlePath = q.articlePath;
		const oldCommitOid = q.oldCommitOid;
		return { ctx, catalogName: q.catalogName, commitOid, articlePath, oldCommitOid };
	},
});

export default getRevisions;
