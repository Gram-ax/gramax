import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Theme from "@ext/Theme/Theme";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

const getLogo: Command<{ workspacePath: WorkspacePath; theme: string }, string> = Command.create({
	path: "workspace/assets/homeLogo/get",
	kind: ResponseKind.file,

	async do({ workspacePath, theme }) {
		const assets = this._app.wm.getWorkspaceAssets(workspacePath);
		if (!assets) return "";
		const themeValue = theme === Theme.light ? Theme.light : Theme.dark;

		return (await assets.logo.get(themeValue)) || "";
	},

	params(_, q) {
		return { workspacePath: q.path, theme: q.theme };
	},
});

export default getLogo;
