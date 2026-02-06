import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { QuizTestCreate } from "@ext/enterprise/components/admin/settings/quiz/types/QuizComponentTypes";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

const addTest: Command<{ ctx: Context; workspaceId: WorkspacePath; test: QuizTestCreate }, boolean> = Command.create({
	path: "enterprise/quiz/test/add",

	kind: ResponseKind.json,

	async do({ ctx, workspaceId, test }) {
		const { wm } = this._app;
		const workspaceConfig = wm.getWorkspaceConfig(workspaceId);
		const gesUrl = workspaceConfig.config.inner().enterprise?.gesUrl;
		const sourceDatas = this._app.rp.getSourceDatas(ctx, workspaceId);
		const enterpriseSource = getEnterpriseSourceData(sourceDatas, gesUrl);

		if (!gesUrl || !enterpriseSource) return false;

		return await new EnterpriseApi(gesUrl).addQuizTest(enterpriseSource.token, test);
	},

	params(ctx, q, body) {
		const { workspaceId } = q;
		return { ctx, workspaceId, test: body };
	},
});

export default addTest;
