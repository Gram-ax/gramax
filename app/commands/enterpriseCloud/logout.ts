import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { Command } from "../../types/Command";

const logout: Command<{ ctx: Context; id: WorkspacePath }, void> = Command.create({
	path: "enterpriseCloud/logout",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ ctx, id }) {
		const { enterpriseCloudManager } = this._app;
		const cloudConfig = enterpriseCloudManager.getConfig();
		const cloudEnabled = cloudConfig.url && cloudConfig.enabled !== false;

		if (!cloudEnabled) return;

		const workspaceConfig = this._app.wm.getWorkspaceConfig(id);
		const gesCloudUrl = workspaceConfig?.config?.inner?.().enterpriseCloud?.url;

		const sourceDatas = this._app.rp.getSourceDatas(ctx, id);
		const enterpriseSource = getEnterpriseSourceData(sourceDatas, gesCloudUrl);

		await this._commands.storage.removeSourceData.do({
			ctx,
			sourceName: getStorageNameByData(enterpriseSource),
		});
		await this._commands.workspace.remove.do({ ctx, id });
		await this._commands.ai.server.removeAiData.do({ ctx, workspacePath: id });
		await this._app.am.logout(ctx.cookie);
	},

	params(ctx, q) {
		return { ctx, id: q.id };
	},
});

export default logout;
