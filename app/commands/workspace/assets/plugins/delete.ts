import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

const deletePlugin: Command<{ workspacePath: WorkspacePath; id: string }, void> = Command.create({
	path: "workspace/assets/plugin/delete",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware()],

	async do({ workspacePath, id }) {
		const assets = this._app.wm.getWorkspaceAssets(workspacePath);
		await assets.plugins.delete(id);
	},

	params(ctx, q, body) {
		return { workspacePath: q.path, id: body.id };
	},
});

export default deletePlugin;
