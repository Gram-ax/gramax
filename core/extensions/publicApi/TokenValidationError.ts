import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";

class TokenValidationError extends DefaultError {
	override get type() {
		return ErrorType.TokenValidation;
	}
}

export default TokenValidationError;
