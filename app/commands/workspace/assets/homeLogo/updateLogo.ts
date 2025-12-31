import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Theme from "@ext/Theme/Theme";

const updateLogo: Command<{ theme: string; workspacePath: string; icon: any }, void> = Command.create({
	path: "workspace/assets/homeLogo/update",
	kind: ResponseKind.none,
	middlewares: [new DesktopModeMiddleware()],

	async do({ theme, icon, workspacePath }) {
		const assets = this._app.wm.getWorkspaceAssets(workspacePath);
		const themeValue = theme === Theme.light ? Theme.light : Theme.dark;

		return assets.logo.set(themeValue, icon);
	},

	params(ctx, q, body) {
		return { theme: q.theme, workspacePath: q.path, icon: body };
	},
});

export default updateLogo;
