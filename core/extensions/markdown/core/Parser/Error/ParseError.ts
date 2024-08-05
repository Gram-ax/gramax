import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";
import t from "@ext/localization/locale/translate";

class ParseError extends DefaultError {
	constructor(cause: Error) {
		super(t("article.error.parse"), cause);
	}

	get type() {
		return ErrorType.Parse;
	}
}

export default ParseError;
