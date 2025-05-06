import Middleware from "./Middleware";
import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import ExceptionsResponse from "@ext/publicApi/ExceptionsResponse";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";

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
