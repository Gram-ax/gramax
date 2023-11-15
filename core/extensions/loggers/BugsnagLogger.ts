import { getExecutingEnvironment } from "@app/resolveModule";
import Bugsnag from "@bugsnag/js";
import sendBug from "../bugsnag/logic/sendBug";
import UserInfo from "../security/logic/User/UserInfo2";
import BaseLogger from "./BaseLogger";
import Logger from "./Logger";

export default class BugsnagLogger extends BaseLogger implements Logger {
	constructor(bugsnagApiKey: string) {
		super();
		if (Bugsnag.isStarted() || !bugsnagApiKey) return;
		Bugsnag.start({ apiKey: bugsnagApiKey });
	}

	logError(e: Error, userInfo?: UserInfo) {
		if (!this._checkErrorLogLevel()) return;
		void sendBug(e, (event) => {
			console.log(userInfo, e);
			if (userInfo) event.setUser(userInfo.id, userInfo.mail, userInfo.name);
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
