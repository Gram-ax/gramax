import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { GitVersionDataSet } from "@ext/git/core/GitVersionControl/GitVersionControl";
import { GitVersion } from "@ext/git/core/model/GitVersion";
import assert from "assert";

const getRevisions: Command<{ catalogName: string; from?: string; depth?: number }, GitVersionDataSet> = Command.create(
	{
		path: "versionControl/revision/getRevisions",

		kind: ResponseKind.json,

		middlewares: [new AuthorizeMiddleware()],

		async do({ catalogName, from, depth }) {
			const { wm } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getContextlessCatalog(catalogName);
			assert(catalog?.repo?.gvc);

			return catalog.repo.gvc.getCommitInfo(from ? new GitVersion(from) : undefined, depth);
		},

		params(ctx, q) {
			return { ctx, catalogName: q.catalogName, from: q.from, depth: q.depth ? Number(q.depth) : undefined };
		},
	},
);

export default getRevisions;
