import Context from "@core/Context/Context";
import { Command } from "../../../types/Command";

const removeAiData: Command<{ ctx: Context; workspacePath: string }, void> = Command.create({
	path: "ai/server/removeData",

	async do({ ctx, workspacePath }) {
		await this._app.adp.removeEditorAiData(ctx, workspacePath);
	},

	params(ctx, q) {
		const workspacePath = q.workspacePath;
		return { ctx, workspacePath };
	},
});

export default removeAiData;
