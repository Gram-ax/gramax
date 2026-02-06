import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

const existTest: Command<{ ctx: Context; workspaceId: WorkspacePath; testId: number }, boolean> = Command.create({
	path: "enterprise/quiz/test/exist",

	kind: ResponseKind.json,

	async do({ ctx, workspaceId, testId }) {
		const { wm } = this._app;
		const workspaceConfig = wm.getWorkspaceConfig(workspaceId);
		const gesUrl = workspaceConfig.config.inner().enterprise?.gesUrl;
		const sourceDatas = this._app.rp.getSourceDatas(ctx, workspaceId);
		const enterpriseSource = getEnterpriseSourceData(sourceDatas, gesUrl);

		if (!gesUrl || !enterpriseSource) return;

		return await new EnterpriseApi(gesUrl).existsQuizTest(enterpriseSource.token, testId);
	},

	params(ctx, q) {
		const { workspaceId } = q;
		const testId = Number(q.testId);
		return { ctx, workspaceId, testId };
	},
});

export default existTest;
