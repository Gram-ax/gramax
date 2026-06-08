import { getExecutingEnvironment } from "@app/resolveModule/env";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";
import t from "@ext/localization/locale/translate";

class ParseError extends DefaultError {
	constructor(cause: Error) {
		const isBrowser = getExecutingEnvironment() === "browser" || getExecutingEnvironment() === "tauri";
		const key = isBrowser ? "article.error.parse.browser" : "article.error.parse.default";
		super(t(key), cause, isBrowser ? { html: true } : undefined);
		this.name = "ParseError";
	}

	get type() {
		return ErrorType.Parse;
	}
}

export default ParseError;
