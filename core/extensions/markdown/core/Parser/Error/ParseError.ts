import { getExecutingEnvironment } from "@app/resolveModule/env";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";
import t from "@ext/localization/locale/translate";

class ParseError extends DefaultError {
	constructor(cause: Error, content: string) {
		const isWeb = getExecutingEnvironment() === "web" || getExecutingEnvironment() === "tauri";
		const key = isWeb ? "article.error.parse.web" : "article.error.parse.default";
		super(t(key), cause, isWeb ? { html: true } : undefined);
		this.name = "ParseError";
		this.setProps({ content });
	}

	get type() {
		return ErrorType.Parse;
	}
}

export default ParseError;
