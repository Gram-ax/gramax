import { getExecutingEnvironment } from "@app/resolveModule/env";
import type Query from "@core/Api/Query";
import { resolveLanguage } from "@ext/localization/core/model/Language";
import type Context from "../../Context/Context";
import type ApiRequest from "../ApiRequest";
import type ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";

export class AuthorizeMiddleware extends Middleware {
	constructor(private _useCorrectUserId: boolean = false) {
		super();
	}

	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		const isNext = getExecutingEnvironment() === "next";
		const query = req.query as Query;
		const ctx = isNext
			? await this._app.contextFactory.from({ req, res, query })
			: await this._app.contextFactory.fromBrowser({ language: resolveLanguage(), query });
		if (!ctx.user.isLogged) {
			setUnauthorized(res);
			return;
		}
		if (!this._useCorrectUserId || CorrectUserId(req, res, ctx)) return this._next.Process(req, res);
	}
}

const CorrectUserId = (req: ApiRequest, res: ApiResponse, ctx: Context): boolean => {
	const { userId } = req.query as { userId: string };
	if (userId !== ctx.user.info.id) {
		setUnauthorized(res);
		return false;
	}
	return true;
};

const setUnauthorized = (res: ApiResponse) => {
	res.statusCode = 401;
	res.end();
};
