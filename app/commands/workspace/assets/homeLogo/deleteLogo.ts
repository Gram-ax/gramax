import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Theme from "@ext/Theme/Theme";
import { PredefinedAssets } from "@ext/workspace/WorkspaceAssets";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

const deleteLogo: Command<{ workspacePath: WorkspacePath; theme: string }, void> = Command.create({
	path: "workspace/assets/homeLogo/delete",
	kind: ResponseKind.none,
	middlewares: [new DesktopModeMiddleware()],

	async do({ workspacePath, theme }) {
		const assets = this._app.wm.getWorkspaceAssets(workspacePath);
		const homeIconPath = theme === Theme.light ? PredefinedAssets.lightHomeIcon : PredefinedAssets.darkHomeIcon;

		return assets.delete(homeIconPath);
	},

	params(ctx, q) {
		return { workspacePath: q.path, theme: q.theme };
	},
});

export default deleteLogo;
