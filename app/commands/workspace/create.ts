import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import setWorkerProxy from "../../../apps/browser/src/logic/setWorkerProxy";
import { Command } from "../../types/Command";

const create: Command<{ config: ClientWorkspaceConfig }, void> = Command.create({
	path: "workspace/create",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ config }) {
		const wm = this._app.wm;
		const { path, ...init } = config;
		const id = await wm.addWorkspace(path, init, true);
		await wm.setWorkspace(id);
		// TODO: Remove if
		if (getExecutingEnvironment() == "browser") {
			const config = await wm.current().config();
			setWorkerProxy(config.services?.gitProxy?.url);
		}
	},

	params(ctx, q, body) {
		return { config: body };
	},
});

export default create;
