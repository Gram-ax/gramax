import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../../types/Command";
import { SourceAiData } from "@ext/ai/models/types";

const setAiData: Command<{ ctx: Context; workspacePath: string; token: string } & SourceAiData, void> = Command.create({
	path: "ai/server/setData",

	kind: ResponseKind.plain,

	do({ ctx, workspacePath, ...data }) {
		this._app.adp.setEditorAiData(ctx, workspacePath, data);
	},

	params(ctx, q, body) {
		const workspacePath = q.workspacePath;
		return { ctx, workspacePath, ...body };
	},
});

export default setAiData;
