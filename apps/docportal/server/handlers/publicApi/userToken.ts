import type Context from "@core/Context/Context";
import type EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import type { TicketManager } from "@ext/security/logic/TicketManager/TicketManager";
import type DocportalApiRequest from "../../logic/DocportalApiRequest";
import { headers } from "./headers";

const DEFAULT_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60 * 1000; //30 days

const userToken = (ctx: Context, req: DocportalApiRequest, ticketManager: TicketManager) => {
	if (ctx.user.type !== "enterprise") {
		return new Response("Not found", { status: 404 });
	}
	const expiresAtParam = req.query.expiresAt as string;
	const expiresAt = expiresAtParam ? new Date(expiresAtParam) : new Date(Date.now() + DEFAULT_TOKEN_EXPIRES_IN);

	if (expiresAtParam) {
		if (Number.isNaN(expiresAt.getTime())) {
			return new Response(
				JSON.stringify({
					error: "Invalid date format",
					message: "The 'expiresAt' parameter must be in YYYY-MM-DD format.",
				}),
				{ status: 400, headers: { ...headers.json } },
			);
		}
		if (expiresAt < new Date()) {
			return new Response(
				JSON.stringify({
					error: "Invalid expiration date",
					message: "The 'expiresAt' parameter must be a future date.",
				}),
				{ status: 400, headers: { ...headers.json } },
			);
		}
		const maxExpirationDate = new Date();
		maxExpirationDate.setFullYear(maxExpirationDate.getFullYear() + 1);
		if (expiresAt > maxExpirationDate) {
			return new Response(
				JSON.stringify({
					error: "Invalid token duration",
					message: "Token expiration cannot be more than 1 year.",
				}),
				{ status: 400, headers: { ...headers.json } },
			);
		}
	}

	return new Response(encodeURIComponent(ticketManager.getUserToken(ctx.user as EnterpriseUser, expiresAt)), {
		status: 200,
		headers: { ...headers.json, ...headers.base },
	});
};

export default userToken;
