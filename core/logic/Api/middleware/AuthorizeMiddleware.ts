import { getExecutingEnvironment } from "@app/resolveModule/env";
import type Query from "@core/Api/Query";
import type ApiRequest from "../ApiRequest";
import type ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";

export class AuthorizeMiddleware extends Middleware {
	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		const isBrowser = getExecutingEnvironment() === "browser";
		const isDesktop = getExecutingEnvironment() === "tauri";

		if (isBrowser || isDesktop) return this._next.Process(req, res);

		const query = req.query as Query;
		const ctx = await this._app.contextFactory.fromNode({ req, res, query });
		if (!ctx.user.isLogged) {
			res.statusCode = 401;
			res.end();
			return;
		}
		return this._next.Process(req, res);
	}
}
