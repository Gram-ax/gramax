import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const logout: Command<{ ctx: Context; id: WorkspacePath }, void> = Command.create({
	path: "enterprise/logout",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ ctx, id }) {
		await this._commands.workspace.remove.do({ ctx, id });
		await this._commands.ai.server.removeAiData.do({ ctx, workspacePath: id });
		await this._app.am.logout(ctx.cookie);
	},

	params(ctx, q) {
		return { ctx, id: q.id };
	},
});

export default logout;
