import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import { handleWebhookPush } from "@ext/publicApi/webhook/handleWebhook";
import { ApplyApiMiddleware } from "../../logic/Api/ApplyMiddleware";

// HMAC verification needs the raw request body — Next's body parser would consume it.
export const config = { api: { bodyParser: false } };

const readRawBody = async (req: ApiRequest): Promise<string> => {
	const chunks: Buffer[] = [];
	for await (const chunk of req as unknown as AsyncIterable<Buffer>) chunks.push(Buffer.from(chunk));
	return Buffer.concat(chunks).toString("utf8");
};

export default ApplyApiMiddleware(
	async function handler(req: ApiRequest, res: ApiResponse) {
		const rawBody = await readRawBody(req);
		let body: unknown;
		try {
			body = rawBody ? JSON.parse(rawBody) : undefined;
		} catch {
			body = undefined;
		}

		const result = await handleWebhookPush({ headers: req.headers, rawBody, body }, this.app.wm.current(), {
			logger: this.app.logger,
		});
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
