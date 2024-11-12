import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const edit: Command<{ data: ClientWorkspaceConfig }, void> = Command.create({
	path: "workspace/edit",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ data }) {
		const wm = this._app.wm;
		const { path, ...init } = data;
		const { config } = wm.getWorkspaceConfig(path);
		config.update(init);
		await config.save();
	},

	params(ctx, q, body) {
		return { data: body };
	},
});

export default edit;
