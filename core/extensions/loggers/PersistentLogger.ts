const MAX_LOG_COUNT = 1000;
const LOCAL_STORAGE_KEY = ".logs";

interface LogStorage {
	clear: () => void;
	set: (data: { logs: string[]; logsHead: number }) => void;
	get: () => { logs: string[]; logsHead: number };
}

export default class PersistentLogger {
	static warn(message: string, scope?: string, meta?: any) {
		this._pushMessage(this._format("warn", message, scope, meta));
	}

	static err(message: string, error: Error, scope?: string, meta?: any) {
		if (scope && meta) meta.s = scope;
		this._pushMessage(this._format("err", message, scope, meta, error));
	}

	static info(message: string, scope?: string, meta?: any) {
		if (scope && meta) meta.s = scope;
		this._pushMessage(this._format("info", message, scope, meta));
	}

	static trace(message: string, meta?: any, scope?: string) {
		if (scope && meta) meta.s = scope;
		this._pushMessage(this._format("trace", message, scope, meta));
	}

	static getRawLogs(): string[] {
		const result: string[] = [];
		const { logs, logsHead } = this._getStorage().get();
		if (!logs.length) return [];
		for (let i = MAX_LOG_COUNT - 1; i >= 0; i--) {
			const log = logs[(logsHead + i) % logs.length];
			if (log) result.push(log);
		}
		return result;
	}

	static getLogs(filter: RegExp, max = MAX_LOG_COUNT) {
		const { logs, logsHead } = this._getStorage().get();
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
		this._getStorage().clear();
	}

	private static _pushMessage(msg: string) {
		const data = this._getStorage().get();
		const logs = data.logs;
		if (!logs.length) return;
		let logsHead = data.logsHead;
		logs[logsHead] = msg;
		logsHead = (logsHead + 1) % MAX_LOG_COUNT;
		this._saveLogs(logs, logsHead);
	}

	private static _format(prefix: string, body: string, scope?: string, meta?: any, error?: Error): string {
		if (scope && meta) meta.s = scope;
		const obj: any = { d: new Date(), p: prefix, b: body };

		if (meta) obj.m = meta;
		if (error) obj.e = error;
		return JSON.stringify(obj);
	}

	private static _saveLogs(logs: string[], logsHead: number) {
		this._getStorage().set({ logs, logsHead });
	}

	private static _getStorage(): LogStorage {
		const loadData = { logs: [], logsHead: 0 };
		if (typeof window === "undefined" || !window.localStorage) {
			if (global.gramax_logger) return global.gramax_logger;

			for (let i = 0; i < MAX_LOG_COUNT; i++) loadData.logs.push(undefined);
			global.gramax_logger = {
				data: loadData,
				clear: () => {
					global.gramax_logger.data = loadData;
				},
				set: (data: { logs: string[]; logsHead: number }) => {
					global.gramax_logger.data = data;
				},
				get: (): { logs: string[]; logsHead: number } => {
					return global.gramax_logger.data;
				},
			};

			return global.gramax_logger;
		} else {
			if (!window.localStorage.getItem(LOCAL_STORAGE_KEY)) {
				for (let i = 0; i < MAX_LOG_COUNT; i++) loadData.logs.push(undefined);
				window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loadData));
			}
			return {
				clear: () => {
					window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loadData));
				},
				set: (data: { logs: string[]; logsHead: number }) => {
					window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
				},
				get: (): { logs: string[]; logsHead: number } => {
					return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY));
				},
			};
		}
	}
}
