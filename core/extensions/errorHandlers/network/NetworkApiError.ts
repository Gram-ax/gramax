import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";

export const NetworkApiErrorCode = "network-api";

export default class NetworkApiError extends DefaultError {
	constructor(
		message: string,
		protected _props: { [key: string]: any } & { url: string; errorJson: any; status: number },
		title?: string,
		cause?: Error,
	) {
		super(message, cause, _props, undefined, title);
	}

	get props() {
		return { ...this._props, errorCode: NetworkApiErrorCode };
	}

	get type() {
		return ErrorType.NetworkApi;
	}
}
