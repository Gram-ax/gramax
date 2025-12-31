import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import type { PluginFiles } from "@ext/workspace/assets/PluginsAsset";

export interface AddPluginCommand {
	workspacePath?: WorkspacePath;
	pluginId: string;
	files: PluginFiles[];
}

const addPlugin: Command<AddPluginCommand, void> = Command.create({
	path: "workspace/assets/plugin/add",

	kind: ResponseKind.none,

	middlewares: [new DesktopModeMiddleware()],

	async do({ workspacePath, pluginId, files }) {
		const assets = this._app.wm.getWorkspaceAssets(workspacePath);
		await assets.plugins.add(pluginId, files);
	},

	params(ctx, q, body) {
		return { workspacePath: q.id, pluginId: body.pluginId, files: body.files };
	},
});

export default addPlugin;
