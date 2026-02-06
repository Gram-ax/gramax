import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { ModuleOptions } from "@ext/enterprise/types/UserSettings";
import { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

const setModules: Command<{ workspacePath: WorkspacePath; modules: ModuleOptions }, void> = Command.create({
	path: "enterprise/modules/set",

	kind: ResponseKind.none,

	async do({ workspacePath, modules }) {
		const config = this._app.wm.getWorkspaceConfig(workspacePath)?.config?.inner();

		await this._commands.workspace.edit.do({
			data: {
				path: workspacePath,
				...config,
				enterprise: {
					...config.enterprise,
					modules: modules,
				},
			},
		});
	},

	params(ctx, q, body) {
		return { workspacePath: q.path, modules: body };
	},
});

export default setModules;
