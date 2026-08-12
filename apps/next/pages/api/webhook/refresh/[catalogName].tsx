import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import { handleWebhookRefresh } from "@ext/publicApi/webhook/handleWebhook";
import { ApplyApiMiddleware } from "../../../../logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function handler(req: ApiRequest, res: ApiResponse) {
		const catalogName = decodeURIComponent(String(req.query.catalogName ?? ""));
		const result = await handleWebhookRefresh(req.headers, this.app.wm.current(), catalogName);
		res.statusCode = result.status;
		if (result.body === undefined) {
			res.end();
			return;
		}
		res.setHeader("Content-type", "application/json; charset=utf-8");
		res.send(result.body);
	},
	[new MainMiddleware()],
);
