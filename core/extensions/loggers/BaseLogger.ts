import { LogLevel } from "./Logger";

export default class BaseLogger {
	private _logLevel: LogLevel = LogLevel.info;

	protected _checkWarningLogLevel() {
		return this._logLevel <= LogLevel.warn;
	}

	protected _checkErrorLogLevel() {
		return this._logLevel <= LogLevel.error;
	}

	protected _checkInfoLogLevel() {
		return this._logLevel <= LogLevel.info;
	}

	protected _checkTraceLogLevel() {
		return this._logLevel <= LogLevel.trace;
	}

	setLogLevel(level: LogLevel) {
		this._logLevel = level;
	}
}
