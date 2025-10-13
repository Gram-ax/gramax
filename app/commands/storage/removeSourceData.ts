import Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const removeSourceData: Command<{ ctx: Context; sourceName: string }, void> = Command.create({
	path: "storage/removeSourceData",

	async do({ ctx, sourceName }) {
		await this._app.rp.removeSource(ctx, sourceName);
	},

	params(ctx, query) {
		return { ctx, sourceName: query.sourceName };
	},
});

export default removeSourceData;
