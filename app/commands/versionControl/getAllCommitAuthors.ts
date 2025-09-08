import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import type { CommitAuthorInfo } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { Command } from "../../types/Command";

const fileStatus: Command<{ catalogName: string; authorFilter?: string }, CommitAuthorInfo[]> = Command.create({
	path: "versionControl/getAllCommitAuthors",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName, authorFilter }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		const vc = catalog?.repo?.gvc;
		if (!vc) return;

		const authors = await vc.getCommitAuthors();
		if (authorFilter) return authors.filter((author) => author.name.includes(authorFilter));
		return authors;
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName, authorFilter: q.authorFilter };
	},
});

export default fileStatus;
