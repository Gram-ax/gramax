import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ErrorType from "@ext/errorHandlers/model/ErrorTypes";
import t from "@ext/localization/locale/translate";

export default class NetworkError extends DefaultError {
	constructor(protected _props?: { [key: string]: any } & { errorCode?: string }) {
		super(t("network.error.body"), null, null, true, t("network.error.title"), "wifi-off");
	}

	get props(): { [key: string]: any } & { errorCode: string } {
		return { errorCode: "network", ...this._props };
	}

	get type() {
		return ErrorType.Network;
	}
}
