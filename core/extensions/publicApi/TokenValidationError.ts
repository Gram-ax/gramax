import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";
import { validataionTokenErrorMessages } from "@ext/publicApi/ExceptionsResponse";

class TokenValidationError extends DefaultError {
	constructor(message: keyof typeof validataionTokenErrorMessages) {
		super(message);
	}
	override get type() {
		return ErrorType.TokenValidation;
	}
}

export default TokenValidationError;
