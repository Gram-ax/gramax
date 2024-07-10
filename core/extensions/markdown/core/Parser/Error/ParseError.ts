import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";

export const parseErrorText = `Gramax не смог прочитать Markdown-конструкцию в файле статьи. 
Кликните Редактировать Markdown, а затем исправьте ошибку или удалите конструкцию.`;

class ParseError extends DefaultError {
	constructor(cause: Error) {
		super(parseErrorText, cause);
	}

	get type() {
		return ErrorType.Parse;
	}
}

export default ParseError;
