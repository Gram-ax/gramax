import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import { GitVersion } from "@ext/git/core/model/GitVersion";
import BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import type { FileStatus } from "@ext/Watchers/model/FileStatus";
import { Command } from "../../types/Command";

export type ClientGitStatus = {
	path: string;
	status: FileStatus;
};

const status: Command<{ ctx: Context; catalogName: string; commitOid?: string }, ClientGitStatus[]> = Command.create({
	path: "versionControl/statuses",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ catalogName, commitOid }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);

		if (!catalog?.repo || catalog.repo instanceof BrokenRepository || catalog.repo.gvc === null) return [];

		if (commitOid) {
			const parentCommitOid = await catalog.repo.gvc.getParentCommitHash(new GitVersion(commitOid));
			const diff = await catalog.repo.gvc.diff({
				compare: { type: "tree", new: commitOid, old: parentCommitOid.toString() },
				renames: true,
			});
			return diff.files.map((file) => ({
				path: catalog.basePath.join(file.path).value,
				status: file.status,
			}));
		}

		if (getExecutingEnvironment() !== "web") await catalog.repo.gvc.add();

		const changes = await catalog.repo.gvc.getChanges("index");

		return changes.map((change) => ({
			path: catalog.basePath.join(change.path).value,
			status: change.status,
		}));
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName, commitOid: q.commitOid };
	},
});

export default status;
