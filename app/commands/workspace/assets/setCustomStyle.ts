import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import { PredefinedAssets } from "@ext/workspace/WorkspaceAssets";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

const setCustomStyle: Command<{ workspacePath?: WorkspacePath; style: string }, void> = Command.create({
	path: "workspace/assets/setCustomStyle",
	kind: ResponseKind.none,
	middlewares: [new DesktopModeMiddleware()],

	async do({ workspacePath, style }) {
		const assets = this._app.wm.getWorkspaceAssets(workspacePath);
		await assets.write(PredefinedAssets.customStyle, style);
	},

	params(ctx, q, body) {
		return { workspacePath: q.id, style: body };
	},
});

export default setCustomStyle;
