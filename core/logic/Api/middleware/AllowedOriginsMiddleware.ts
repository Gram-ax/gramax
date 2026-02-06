import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { ErrorTitle } from "@ext/publicApi/ExceptionsResponse";
import Cors from "cors";
import Middleware from "./Middleware";

export class AllowedOriginsMiddleware extends Middleware {
	private _corsMiddleware: ReturnType<typeof Cors>;

	constructor() {
		super();
		this._corsMiddleware = Cors({
			origin: (origin, callback) => {
				const allowedOrigins = this._app.conf.allowedOrigins;
				if (!origin || (allowedOrigins?.length && allowedOrigins.includes(origin))) {
					callback(null, true);
				} else {
					callback(null, false);
				}
			},
		});
	}

	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		const isOriginAllowed =
			!req.headers.origin ||
			(await new Promise<boolean>((resolve) => {
				this._corsMiddleware(req as any, res as any, (err: any) => {
					if (err) {
						return resolve(false);
					}
					const corsHeader = res.getHeader("Access-Control-Allow-Origin");
					resolve(!!corsHeader);
				});
			}));

		if (isOriginAllowed) {
			await this._next.Process(req, res);
		} else {
			res.statusCode = 403;
			res.setHeader("Content-Type", "application/json; charset=utf-8");
			res.setHeader("Vary", "Origin");
			res.send({
				error: ErrorTitle.Forbidden,
				message: "CORS policy violation: Origin not allowed",
			});
		}
	}
}
