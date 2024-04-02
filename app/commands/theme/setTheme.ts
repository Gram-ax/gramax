import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Theme from "@ext/Theme/Theme";
import { Command } from "../../types/Command";

const setTheme: Command<{ ctx: Context; theme: Theme }, void> = Command.create({
	path: "theme/set",

	kind: ResponseKind.none,

	middlewares: [],

	do({ ctx, theme }) {
		this._app.tm.setTheme(ctx.cookie, theme);
	},

	params(ctx, q) {
		return { ctx, theme: q.theme as Theme };
	},
});

export default setTheme;
