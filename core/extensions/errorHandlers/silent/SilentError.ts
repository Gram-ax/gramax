import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";

export default class SilentError extends DefaultError {
	constructor(message: string, cause?: Error, protected _props?: { [key: string]: any } & { errorCode?: string }) {
		super(message, cause);
	}

	get props(): { [key: string]: any } & { errorCode: string } {
		return { ...this._props, errorCode: "silent" };
	}

	get type() {
		return ErrorType.Silent;
	}
}
