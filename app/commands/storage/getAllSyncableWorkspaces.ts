import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import { SilentMiddleware } from "@core/Api/middleware/SilentMiddleware";
import type Context from "@core/Context/Context";
import BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const getAllSyncableWorkspaces: Command<
	{ ctx: Context; shouldFetch: WorkspacePath[] },
	{ workspaces: { [key: WorkspacePath]: number } }
> = Command.create({
	path: "storage/getAllSyncableWorkspaces",

	kind: ResponseKind.json,

	middlewares: [new NetworkConnectMiddleWare(), new AuthorizeMiddleware(), new SilentMiddleware()],

	async do({ ctx, shouldFetch }) {
		const { wm } = this._app;

		const res = new Map<WorkspacePath, number>();

		const workspaces = await wm.getUnintializedWorkspaces();

		await workspaces.forEachAsync(async (workspace) => {
			const label = `sync workspace: ${workspace.path()}`;
			console.group(label);
			await workspace.getCatalogNames().forEachAsync(async (name) => {
				const source = await workspace.getSourceByCatalogName(ctx, name);
				const repo = workspace.getRepositoryByName(name);

				if (!source || source.isInvalid || repo instanceof BrokenRepository) return;

				if (
					await repo.isShouldSync({
						data: source,
						shouldFetch: shouldFetch.includes(workspace.path()),
						lockFetch: false,
					})
				)
					res.set(workspace.path(), (res.get(workspace.path()) || 0) + 1);
			}, 3);
			console.groupEnd();
		}, 1);

		return { workspaces: Object.fromEntries(res.entries()) };
	},

	params(ctx, q, body) {
		return { ctx, shouldFetch: body };
	},
});

export default getAllSyncableWorkspaces;
