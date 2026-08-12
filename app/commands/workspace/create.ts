import { ResponseKind } from "@app/types/ResponseKind";
import applyWorkspaceServices from "@app/utils/applyWorkspaceServices";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
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
		applyWorkspaceServices(await wm.current().config());
	},

	params(_ctx, _q, body) {
		return { config: body };
	},
});

export default create;
