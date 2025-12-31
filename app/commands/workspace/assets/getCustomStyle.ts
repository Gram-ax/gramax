import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

const getCustomStyle: Command<{ workspacePath?: WorkspacePath }, string> = Command.create({
	path: "workspace/assets/getCustomStyle",
	kind: ResponseKind.plain,

	async do({ workspacePath }) {
		const assets = this._app.wm.getWorkspaceAssets(workspacePath);
		if (!assets) return "";

		const content = await assets.style.getContent();
		return content ?? "";
	},

	params(ctx, q) {
		return { workspacePath: q.path };
	},
});

export default getCustomStyle;
