import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Theme from "@ext/Theme/Theme";
import { PredefinedAssets } from "@ext/workspace/WorkspaceAssets";

const updateLogo: Command<{ theme: string; workspacePath: string; icon: any }, void> = Command.create({
	path: "workspace/assets/homeLogo/update",
	kind: ResponseKind.none,
	middlewares: [new DesktopModeMiddleware()],

	async do({ theme, icon, workspacePath }) {
		const assets = this._app.wm.getWorkspaceAssets(workspacePath);
		const homeIconPath = theme === Theme.light ? PredefinedAssets.lightHomeIcon : PredefinedAssets.darkHomeIcon;

		return assets.write(homeIconPath, icon);
	},

	params(ctx, q, body) {
		return { theme: q.theme, workspacePath: q.path, icon: body };
	},
});

export default updateLogo;
