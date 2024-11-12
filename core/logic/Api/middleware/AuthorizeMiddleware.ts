import { getExecutingEnvironment } from "@app/resolveModule/env";
import Query from "@core/Api/Query";
import { defaultLanguage } from "@ext/localization/core/model/Language";
import Context from "../../Context/Context";
import ApiRequest from "../ApiRequest";
import ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";

export class AuthorizeMiddleware extends Middleware {
	constructor(private _useCorrectUserId: boolean = false) {
		super();
	}

	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		const isNext = getExecutingEnvironment() === "next";
		const ctx = isNext
			? await this._app.contextFactory.from(req, res, req.query)
			: this._app.contextFactory.fromBrowser(defaultLanguage, req.query as Query);
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
