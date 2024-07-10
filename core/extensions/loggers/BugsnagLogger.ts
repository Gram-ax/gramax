import { AppConfig } from "@app/config/AppConfig";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import Bugsnag from "@bugsnag/js";
import normalizeStacktrace from "@ext/bugsnag/logic/normalizeStacktrace";
import PersistentLogger from "@ext/loggers/PersistentLogger";
import sendBug from "../bugsnag/logic/sendBug";
import BaseLogger from "./BaseLogger";
import Logger from "./Logger";

export default class BugsnagLogger extends BaseLogger implements Logger {
	constructor(config: AppConfig) {
		super();
		const target = getExecutingEnvironment().toUpperCase();
		if (Bugsnag.isStarted() || !config.bugsnagApiKey) return;
		Bugsnag.start({
			releaseStage: "production",
			apiKey: config.bugsnagApiKey,
			appVersion: config.buildVersion,
			onError: (e) => {
				e.errors.forEach((e) => {
					if (!e.errorMessage.includes(target)) e.errorMessage = `[${target}] ${e.errorMessage}`;
					normalizeStacktrace(e.stacktrace);
				});
				e.addMetadata("logic_props", {
					"1-config": config,
					"2-cmdLogs": PersistentLogger.getLogs(/cmd/, 15),
					"3-gitLogs": PersistentLogger.getLogs(/git/, 100),
				});
			},
		});
		console.log(`Bugsnag is started! [AppVersion:${config.buildVersion}]`);
	}

	logError(e: Error) {
		if (!this._checkErrorLogLevel()) return;
		void sendBug(e);
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
