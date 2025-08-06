import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";

class CliUserError extends DefaultError {
	override get type() {
		return ErrorType.CliUser;
	}
}

export default CliUserError;
