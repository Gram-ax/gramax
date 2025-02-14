import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import type { FileStatus } from "@ext/Watchers/model/FileStatus";
import { Command } from "../../types/Command";

export type ClientGitStatus = {
	path: string;
	status: FileStatus;
};

const status: Command<{ ctx: Context; catalogName: string }, ClientGitStatus[]> = Command.create({
	path: "versionControl/statuses",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ catalogName }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog?.repo?.gvc) return;

		await catalog.repo.gvc.add();

		const status = await catalog.repo.gvc.getChanges("index");

		return status.map((change) => ({
			path: catalog.basePath.join(change.path).value,
			status: change.status,
		}));
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default status;
