import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import type Context from "@core/Context/Context";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const getAllSyncableWorkspaces: Command<
	{ ctx: Context; shouldFetch: WorkspacePath[] },
	{ workspaces: { [key: WorkspacePath]: number } }
> = Command.create({
	path: "storage/getAllSyncableWorkspaces",

	kind: ResponseKind.json,

	middlewares: [new NetworkConnectMiddleWare(), new AuthorizeMiddleware()],

	async do({ ctx, shouldFetch }) {
		const { wm } = this._app;

		const res = new Map<WorkspacePath, number>();

		const workspaces = await wm.getUnintializedWorkspaces();

		await workspaces.forEachAsync(async (workspace) => {
			await workspace.getCatalogNames().forEachAsync(async (name) => {
				const source = await workspace.getSourceByCatalogName(ctx, name);
				const repo = workspace.getRepositoryByName(name);

				if (!source || source.isInvalid) return;

				if (await repo.isShouldSync({ data: source, shouldFetch: shouldFetch.includes(workspace.path()) }))
					res.set(workspace.path(), (res.get(workspace.path()) || 0) + 1);
			}, 3);
		}, 2);

		return { workspaces: Object.fromEntries(res.entries()) };
	},

	params(ctx, q, body) {
		return { ctx, shouldFetch: body };
	},
});

export default getAllSyncableWorkspaces;
