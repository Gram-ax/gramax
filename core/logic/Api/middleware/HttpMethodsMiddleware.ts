import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import Middleware from "./Middleware";

export class HttpMethodsMiddleware extends Middleware {
	private readonly _allowedMethods: string[];

	constructor(allowedMethods: string[] = ["GET", "HEAD", "OPTIONS"]) {
		super();
		this._allowedMethods = allowedMethods;
	}

	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		res.setHeader("Allow", this._allowedMethods.join(", "));
		res.setHeader("Access-Control-Allow-Methods", this._allowedMethods.join(", "));
		res.setHeader("Access-Control-Allow-Origin", "*");

		if (req.method === "OPTIONS") {
			res.setHeader("Access-Control-Max-Age", "86400");
			res.setHeader("Content-Length", "0");
			res.end();
			return;
		}

		if (!this._allowedMethods.includes(req.method)) {
			res.statusCode = 405;
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.send("Method Not Allowed");
			return;
		}

		await this._next.Process(req, res);
	}
}
