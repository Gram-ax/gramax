import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type { PluginsListResult } from "@ext/workspace/assets/PluginsAsset";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

export type GetPluginsResponse = PluginsListResult;

const getPlugins: Command<{ workspacePath?: WorkspacePath }, GetPluginsResponse> = Command.create({
	path: "workspace/assets/plugin/getAll",

	kind: ResponseKind.json,

	async do({ workspacePath }) {
		const assets = this._app.wm.getWorkspaceAssets(workspacePath);
		if (!assets) return { plugins: [], errors: [] };

		return assets.plugins.getAll();
	},

	params(ctx, q) {
		return { workspacePath: q.path };
	},
});

export default getPlugins;
