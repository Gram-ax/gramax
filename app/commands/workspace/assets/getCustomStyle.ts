import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { PredefinedAssets } from "@ext/workspace/WorkspaceAssets";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

const getCustomStyle: Command<{ workspacePath?: WorkspacePath }, string> = Command.create({
	path: "workspace/assets/getCustomStyle",
	kind: ResponseKind.plain,

	async do({ workspacePath }) {
		const assets = this._app.wm.getWorkspaceAssets(workspacePath);
		return assets.get(PredefinedAssets.customStyle);
	},

	params(ctx, q) {
		return { workspacePath: q.id };
	},
});

export default getCustomStyle;
