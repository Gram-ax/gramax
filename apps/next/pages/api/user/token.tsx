import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";

const DEFAULT_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60 * 1000; //30 days

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const ctx = await this.app.contextFactory.from(req, res);
		if (ctx.user.type !== "enterprise") {
			res.statusCode = 404;
			res.end();
			return;
		}
		const expiresAtParam = req.query.expiresAt as string;
		const expiresAt = expiresAtParam ? new Date(expiresAtParam) : new Date(Date.now() + DEFAULT_TOKEN_EXPIRES_IN);

		if (expiresAtParam) {
			if (isNaN(expiresAt.getTime())) {
				res.statusCode = 400;
				res.send({
					error: "Invalid date format",
					message: "The 'expiresAt' parameter must be in YYYY-MM-DD format.",
				});
				return;
			}
			if (expiresAt < new Date()) {
				res.statusCode = 400;
				res.send({
					error: "Invalid expiration date",
					message: "The 'expiresAt' parameter must be a future date.",
				});
				return;
			}
			const maxExpirationDate = new Date();
			maxExpirationDate.setFullYear(maxExpirationDate.getFullYear() + 1);
			if (expiresAt > maxExpirationDate) {
				res.statusCode = 400;
				res.send({
					error: "Invalid token duration",
					message: "Token expiration cannot be more than 1 year.",
				});
				return;
			}
		}

		res.statusCode = 200;
		res.send(encodeURIComponent(this.app.ticketManager.getUserToken(ctx.user as EnterpriseUser, expiresAt)));
	},
	[new AuthorizeMiddleware()],
);
