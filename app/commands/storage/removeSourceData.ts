import Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const removeSourceData: Command<{ ctx: Context; sourceName: string }, void> = Command.create({
	path: "storage/removeSourceData",

	do({ ctx, sourceName }) {
		this._app.rp.removeSourceData(ctx.cookie, sourceName);
	},

	params(ctx, query) {
		return { ctx, sourceName: query.sourceName };
	},
});

export default removeSourceData;
