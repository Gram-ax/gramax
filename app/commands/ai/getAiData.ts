import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";
import { AiServerConfig } from "@ext/ai/models/types";

const getAiData: Command<{ ctx: Context; workspacePath: string }, AiServerConfig> = Command.create({
	path: "ai/getData",

	kind: ResponseKind.plain,

	do({ ctx, workspacePath }) {
		return this._app.adp.getEditorAiData(ctx, workspacePath);
	},

	params(ctx, q) {
		const workspacePath = q.workspacePath;
		return { ctx, workspacePath };
	},
});

export default getAiData;
