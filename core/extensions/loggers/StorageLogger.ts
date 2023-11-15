import UserInfo from "@ext/security/logic/User/UserInfo2";

export default abstract class StorageLogger {
	private static readonly _logsCount = 1000;
	private static readonly _storageNameKey = ".logs";

	static logWarning(message: string) {
		const msg = `WARNING: ${message}`;
		this._pushMessage(msg);
	}

	static logError(e: Error, message?: string, userInfo?: UserInfo) {
		const msg = `${userInfo ? `userInfo.mail: ${userInfo.mail} ` : ""}ERROR: ${e.message} ${
			message ? message + " " : ""
		}`;
		this._pushMessage(msg);
	}

	static logInfo(message: string) {
		this._pushMessage(message);
	}

	static logTrace(message: string) {
		this._pushMessage(message);
	}

	static getLogs(): string[] {
		const result: string[] = [];
		const { logs, logsHead } = this._loadLogs();
		if (!logs.length) return [];
		for (let i = this._logsCount - 1; i >= 0; i--) {
			const log = logs[(logsHead + i) % logs.length];
			if (log) result.push(log);
		}
		return result;
	}

	static clearLogs(): void {
		const storage = window?.localStorage;
		if (!storage) return;
		storage.removeItem(this._storageNameKey);
	}

	private static _pushMessage(msg: string) {
		const data = this._loadLogs();
		const logs = data.logs;
		if (!logs.length) return;
		let logsHead = data.logsHead;
		logs[logsHead] = msg;
		logsHead = (logsHead + 1) % this._logsCount;
		this._saveLogs(logs, logsHead);
	}

	private static _saveLogs(logs: string[], logsHead: number) {
		const storage = window?.localStorage;
		if (!storage) return;
		storage.setItem(this._storageNameKey, JSON.stringify({ logs, logsHead }));
	}

	private static _loadLogs(): { logs: string[]; logsHead: number } {
		const logs: string[] = [];
		const storage = window?.localStorage;
		if (!storage) return { logs: [], logsHead: 0 };
		if (storage.getItem(this._storageNameKey)) {
			return JSON.parse(storage.getItem(this._storageNameKey)) as {
				logsHead: number;
				logs: string[];
			};
		}
		for (let i = 0; i < this._logsCount; i++) logs.push(undefined);
		return { logs, logsHead: 0 };
	}
}
