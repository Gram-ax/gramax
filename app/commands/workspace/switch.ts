import { ResponseKind } from "@app/types/ResponseKind";
import applyWorkspaceServices from "@app/utils/applyWorkspaceServices";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const switchWorkspace: Command<{ id: WorkspacePath }, void> = Command.create({
	path: "workspace/switch",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ id }) {
		await this._app.wm.setWorkspace(id);
		applyWorkspaceServices(await this._app.wm.current().config());
	},

	params(_ctx, q) {
		return { id: q.id };
	},
});

export default switchWorkspace;
