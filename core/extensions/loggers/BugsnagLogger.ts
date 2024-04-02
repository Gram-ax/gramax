import { getExecutingEnvironment } from "@app/resolveModule/env";
import Bugsnag from "@bugsnag/js";
import sendBug from "../bugsnag/logic/sendBug";
import BaseLogger from "./BaseLogger";
import Logger from "./Logger";

export default class BugsnagLogger extends BaseLogger implements Logger {
	constructor(bugsnagApiKey: string) {
		super();
		if (Bugsnag.isStarted() || !bugsnagApiKey) return;
		Bugsnag.start({ apiKey: bugsnagApiKey });
	}

	logError(e: Error) {
		if (!this._checkErrorLogLevel()) return;
		void sendBug(e, (event) => {
			event.addFeatureFlag("env", getExecutingEnvironment());
		});
	}

	logWarning(message: string) {
		if (this._checkWarningLogLevel()) console.warn(message);
	}

	logInfo(message: string) {
		if (this._checkInfoLogLevel()) console.log(message);
	}

	logTrace(message: string) {
		if (this._checkTraceLogLevel) console.log(message);
	}
}
