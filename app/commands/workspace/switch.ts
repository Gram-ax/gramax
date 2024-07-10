import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const _switch: Command<{ id: WorkspacePath }, void> = Command.create({
	path: "workspace/switch",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ id }) {
		await this._app.wm.setWorkspace(id);
	},

	params(ctx, q) {
		return { id: q.id };
	},
});

export default _switch;
