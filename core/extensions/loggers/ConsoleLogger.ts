import BaseLogger from "./BaseLogger";
import Logger from "./Logger";

export default class ConsoleLogger extends BaseLogger implements Logger {
	constructor() {
		super();
	}

	logWarning(message: string) {
		if (this._checkWarningLogLevel()) console.warn(message);
	}

	logError(e: Error) {
		if (this._checkErrorLogLevel()) console.error(e);
	}

	logInfo(message: any) {
		if (this._checkInfoLogLevel()) console.log(message);
	}

	logTrace(message: any) {
		if (this._checkTraceLogLevel) console.log(message);
	}
}
