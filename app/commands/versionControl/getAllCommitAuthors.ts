import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import type { CommitAuthorInfo } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { Command } from "../../types/Command";

const fileStatus: Command<{ catalogName: string }, CommitAuthorInfo[]> = Command.create({
	path: "versionControl/getAllCommitAuthors",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		const vc = catalog?.repo?.gvc;
		if (!vc) return;

		return vc.getCommitAuthors();
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default fileStatus;
