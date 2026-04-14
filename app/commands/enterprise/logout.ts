import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const logout: Command<{ ctx: Context; id: WorkspacePath }, void> = Command.create({
	path: "enterprise/logout",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ ctx, id }) {
		const workspaceConfig = this._app.wm.getWorkspaceConfig(id);
		const gesUrl = workspaceConfig?.config?.inner?.().enterprise?.gesUrl;
		const activeGesUrl = this._app.em.getConfig().gesUrl;

		if (!gesUrl || !activeGesUrl || gesUrl !== activeGesUrl) return;

		const sourceDatas = this._app.rp.getSourceDatas(ctx, id);
		const enterpriseSource = getEnterpriseSourceData(sourceDatas, gesUrl);

		if (enterpriseSource) await new EnterpriseApi(gesUrl).logout(enterpriseSource.token);

		const isTauri = getExecutingEnvironment() === "tauri";
		await this._commands.storage.removeSourceData.do({
			ctx,
			sourceName: getStorageNameByData(enterpriseSource),
		});
		if (isTauri) {
			await this._commands.workspace.remove.do({ ctx, id });
			await this._app.em.clearGesUrl();
		}

		await this._commands.ai.server.removeAiData.do({ ctx, workspacePath: id });
		await this._app.am.logout(ctx.cookie);
	},

	params(ctx, q) {
		return { ctx, id: q.id };
	},
});

export default logout;
