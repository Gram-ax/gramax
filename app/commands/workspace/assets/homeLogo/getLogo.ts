import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Theme from "@ext/Theme/Theme";
import { PredefinedAssets } from "@ext/workspace/WorkspaceAssets";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

const getLogo: Command<{ workspacePath: WorkspacePath; theme: string }, any> = Command.create({
	path: "workspace/assets/homeLogo/get",
	kind: ResponseKind.file,

	async do({ workspacePath, theme }) {
		const assets = this._app.wm.getWorkspaceAssets(workspacePath);
		const homeIconPath = theme === Theme.light ? PredefinedAssets.lightHomeIcon : PredefinedAssets.darkHomeIcon;

		return assets.get(homeIconPath);
	},

	params(ctx, q) {
		return { workspacePath: q.path, theme: q.theme };
	},
});

export default getLogo;
