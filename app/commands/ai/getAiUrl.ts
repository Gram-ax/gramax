import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const getAiUrl: Command<{ ctx: Context; workspacePath: string }, string> = Command.create({
	path: "ai/getUrl",

	kind: ResponseKind.plain,

	do({ ctx, workspacePath }) {
		return this._app.adp.getEditorAiData(ctx, workspacePath).apiUrl;
	},

	params(ctx, q) {
		const workspacePath = q.workspacePath;
		return { ctx, workspacePath };
	},
});

export default getAiUrl;
