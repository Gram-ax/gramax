const MAX_LOG_COUNT = 1000;
const LOCAL_STORAGE_KEY = ".logs";

export default class PersistentLogger {
	static warn(message: string, scope?: string, meta?: any) {
		this._pushMessage(this._format("warn", message, scope, meta));
	}

	static err(message: string, error: Error, scope?: string, meta?: any) {
		if (scope) meta.s = scope;
		this._pushMessage(this._format("err", message, scope, meta, error));
	}

	static info(message: string, scope?: string, meta?: any) {
		if (scope) meta.s = scope;
		this._pushMessage(this._format("info", message, scope, meta));
	}

	static trace(message: string, meta?: any, scope?: string) {
		if (scope) meta.s = scope;
		this._pushMessage(this._format("trace", message, scope, meta));
	}

	static getRawLogs(): string[] {
		const result: string[] = [];
		const { logs, logsHead } = this._loadLogs();
		if (!logs.length) return [];
		for (let i = MAX_LOG_COUNT - 1; i >= 0; i--) {
			const log = logs[(logsHead + i) % logs.length];
			if (log) result.push(log);
		}
		return result;
	}

	static getLogs(filter: RegExp, max = MAX_LOG_COUNT) {
		const { logs, logsHead } = this._loadLogs();
		const result: string[] = [];

		for (let i = logs.length - 1; i >= 0; i--) {
			const log = logs[(logsHead + i) % logs.length];
			if (!log || !filter.test(log)) continue;

			result.push(JSON.parse(log));
			if (result.length >= max) i = -1;
		}

		return result;
	}

	static clearLogs(): void {
		if (typeof window === "undefined") return;
		const storage = window.localStorage;
		storage.removeItem(LOCAL_STORAGE_KEY);
	}

	private static _pushMessage(msg: string) {
		const data = this._loadLogs();
		const logs = data.logs;
		if (!logs.length) return;
		let logsHead = data.logsHead;
		logs[logsHead] = msg;
		logsHead = (logsHead + 1) % MAX_LOG_COUNT;
		this._saveLogs(logs, logsHead);
	}

	private static _format(prefix: string, body: string, scope?: string, meta?: any, error?: Error): string {
		if (scope) meta.s = scope;
		const obj: any = { d: new Date(), p: prefix, b: body };

		if (meta) obj.m = meta;
		if (error) obj.e = error;
		return JSON.stringify(obj);
	}

	private static _saveLogs(logs: string[], logsHead: number) {
		if (typeof window === "undefined") return;
		const storage = window.localStorage;
		storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ logs, logsHead }));
	}

	private static _loadLogs(): { logs: string[]; logsHead: number } {
		if (typeof window === "undefined" || !window.localStorage) return { logs: [], logsHead: 0 };
		const logs: string[] = [];
		const storage = window.localStorage;
		if (storage.getItem(LOCAL_STORAGE_KEY)) {
			return JSON.parse(storage.getItem(LOCAL_STORAGE_KEY)) as {
				logsHead: number;
				logs: string[];
			};
		}
		for (let i = 0; i < MAX_LOG_COUNT; i++) logs.push(undefined);
		return { logs, logsHead: 0 };
	}
}
