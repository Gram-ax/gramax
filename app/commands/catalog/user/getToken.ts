import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import { Command } from "../../../types/Command";

const getUserTicket: Command<{ ctx: Context }, string> = Command.create({
	path: "user/token",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware()],

	do({ ctx }) {
		if (ctx.user.type === "enterprise")
			return encodeURIComponent(this._app.ticketManager.getUserToken(ctx.user as EnterpriseUser));
	},

	params(ctx) {
		return { ctx };
	},
});

export default getUserTicket;
