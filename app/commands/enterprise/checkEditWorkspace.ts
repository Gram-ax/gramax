import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { EnterpriseAuthResult } from "@ext/enterprise/types/EnterpriseAuthResult";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

const editWorkspace: Command<{ ctx: Context; workspaceId: WorkspacePath }, { status: EnterpriseAuthResult }> =
	Command.create({
		path: "enterprise/checkEditWorkspace",

		kind: ResponseKind.json,

		async do({ ctx, workspaceId }) {
			const { wm } = this._app;
			const workspaceConfig = wm.getWorkspaceConfig(workspaceId);
			const gesUrl = workspaceConfig.config.inner().enterprise?.gesUrl;
			const sourceDatas = this._app.rp.getSourceDatas(ctx, workspaceId);
			const enterpriseSource = getEnterpriseSourceData(sourceDatas, gesUrl);

			if (!gesUrl || !enterpriseSource) return { status: EnterpriseAuthResult.Error };

			return { status: await new EnterpriseApi(gesUrl).checkIsAdmin(enterpriseSource.token) };
		},

		params(ctx, q) {
			return { ctx, workspaceId: q.workspaceId };
		},
	});

export default editWorkspace;
