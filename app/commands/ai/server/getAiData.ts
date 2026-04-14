import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import type { AiServerConfig } from "@ext/ai/models/types";
import { Command } from "../../../types/Command";

const getAiData: Command<{ ctx: Context; workspacePath: string }, AiServerConfig> = Command.create({
	path: "ai/server/getData",

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
