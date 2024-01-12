export default interface Logger {
	logTrace: (message: string) => void;
	logInfo: (message: string) => void;
	logWarning: (message: string) => void;
	logError: (e: Error) => void;
	setLogLevel: (level: LogLevel) => void;
}

export enum LogLevel {
	trace,
	info,
	warn,
	error,
}
