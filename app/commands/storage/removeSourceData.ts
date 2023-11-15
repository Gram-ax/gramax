import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const removeSourceData: Command<{ ctx: Context; sourceName: string }, void> = Command.create({
	path: "storage/removeSourceData",

	middlewares: [new DesktopModeMiddleware()],

	do({ ctx, sourceName }) {
		this._app.sp.removeSourceData(ctx.cookie, sourceName);
	},

	params(ctx, query) {
		return { ctx, sourceName: query.sourceName };
	},
});

export default removeSourceData;
