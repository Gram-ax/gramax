import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import { QuizAnswerCreate } from "@ext/enterprise/components/admin/settings/quiz/types/QuizComponentTypes";

const addAnswer: Command<{ ctx: Context; workspaceId: WorkspacePath; answer: QuizAnswerCreate }, boolean> =
	Command.create({
		path: "enterprise/quiz/answer/add",

		kind: ResponseKind.json,

		async do({ ctx, workspaceId, answer }) {
			const { wm } = this._app;
			const workspaceConfig = wm.getWorkspaceConfig(workspaceId);
			const gesUrl = workspaceConfig.config.inner().enterprise?.gesUrl;
			const sourceDatas = this._app.rp.getSourceDatas(ctx, workspaceId);
			const enterpriseSource = getEnterpriseSourceData(sourceDatas, gesUrl);

			if (!gesUrl || !enterpriseSource) return false;

			return await new EnterpriseApi(gesUrl).addQuizAnswer(enterpriseSource.token, answer);
		},

		params(ctx, q, body) {
			const { workspaceId } = q;
			return { ctx, workspaceId, answer: body };
		},
	});

export default addAnswer;
