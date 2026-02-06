import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";
import ExceptionsResponse from "@ext/publicApi/ExceptionsResponse";
import Middleware from "./Middleware";

export class TokenValidationMiddleware extends Middleware {
	constructor() {
		super();
	}

	async Process(req: ApiRequest, res: ApiResponse) {
		try {
			await this._next.Process(req, res);
		} catch (error) {
			if (error.type !== ErrorType.TokenValidation) throw error;

			new ExceptionsResponse(res).getValidataionTokenException(error.message);
		}
	}
}
