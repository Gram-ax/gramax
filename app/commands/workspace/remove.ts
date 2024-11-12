import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import setWorkerProxy from "../../../apps/browser/src/logic/setWorkerProxy";
import { Command } from "../../types/Command";

const remove: Command<{ ctx: Context; id: WorkspacePath }, void> = Command.create({
	path: "workspace/remove",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ id }) {
		await this._app.wm.removeWorkspace(id);
		// TODO: Remove if
		if (getExecutingEnvironment() == "browser")
			setWorkerProxy(this._app.wm.current().config().services?.gitProxy?.url);
	},

	params(ctx, q) {
		return { ctx, id: q.id };
	},
});

export default remove;
