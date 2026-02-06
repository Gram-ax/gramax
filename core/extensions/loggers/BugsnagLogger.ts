import type { AppConfig } from "@app/config/AppConfig";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import bugsnag from "@dynamicImports/bugsnag";
import normalizeStacktrace from "@ext/bugsnag/logic/normalizeStacktrace";
import PersistentLogger from "@ext/loggers/PersistentLogger";
import sendBug from "../bugsnag/logic/sendBug";
import BaseLogger from "./BaseLogger";
import type Logger from "./Logger";

export default class BugsnagLogger extends BaseLogger implements Logger {
	private constructor() {
		super();
	}

	static async init(config: AppConfig): Promise<BugsnagLogger> {
		const bugsnagStarted = await BugsnagLogger.startBugsnag(config);
		if (bugsnagStarted) console.log(`Bugsnag is started! [AppVersion:${config.buildVersion}]`);
		return new BugsnagLogger();
	}

	private static async startBugsnag(config: AppConfig) {
		if (!config.bugsnagApiKey) return;
		const Bugsnag = (await bugsnag()).default;
		if (Bugsnag.isStarted()) return;
		const target = getExecutingEnvironment().toUpperCase();
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
		return true;
	}

	logError(e: Error, errorDisplayed?: boolean) {
		if (!this._checkErrorLogLevel()) return;
		if (errorDisplayed)
			void bugsnag().then(({ default: Bugsnag }) => Bugsnag.addMetadata("user", "errorDisplayed", true));
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
