import type { AppConfig } from "@app/config/AppConfig";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import bugsnag from "@dynamicImports/bugsnag";
import normalizeStacktrace from "@ext/bugsnag/logic/normalizeStacktrace";
import sendBug from "../bugsnag/logic/sendBug";
import BaseLogger from "./BaseLogger";
import type Logger from "./Logger";

export default class BugsnagLogger extends BaseLogger implements Logger {
	private static readonly REDACTED = "<redacted>";

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
					"1-config": this._getSanitizedConfig(config),
				});
			},
		});
		return true;
	}

	private static _getSanitizedConfig(config: AppConfig) {
		const sanitizedConfig: AppConfig = {
			...config,
			tokens: {
				cookie: this._redactIfPresent(config.tokens.cookie),
				share: this._redactIfPresent(config.tokens.share),
			},
			admin: {
				login: this._redactIfPresent(config.admin.login),
				password: this._redactIfPresent(config.admin.password),
			},
			mail: {
				user: this._redactIfPresent(config.mail.user),
				password: this._redactIfPresent(config.mail.password),
			},
			portalAi: {
				...config.portalAi,
				token: this._redactIfPresent(config.portalAi.token),
			},
		};
		return sanitizedConfig;
	}

	private static _redactIfPresent(value: string | null): string | null {
		return value ? this.REDACTED : value;
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
