import { listen } from "@tauri-apps/api/event";

export type LogEvent = {
	level: "INFO" | "WARN" | "ERROR" | "DEBUG" | "TRACE";
	message: string;
	target: string;
	file: string;
	line: number;
};

const logLevels = {
	INFO: console.info,
	WARN: console.warn,
	ERROR: console.error,
	DEBUG: console.debug,
	TRACE: console.trace,
};

export const attachConsole = async () => {
	void listen<string>("log", (p) => {
		const { level, message, target, file, line } = JSON.parse(p.payload) as LogEvent;
		const log = file && line ? `${target}: ${message} (${file}:${line})` : `${target}: ${message}`;
		logLevels[level](log);
	});

	// const { log, warn, error, debug, trace } = console;

	// const logInner = (method: string, originalFn: (...args: any[]) => void, level: string) => {
	// 	(console as any)[method] = (message: string, ...args: any[]) => {
	// 		originalFn(message, ...args);
	// 		void invoke("js_log", {
	// 			level,
	// 			message: typeof message === "string" ? message : JSON.stringify(message, null, 2),
	// 			data: args?.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : a)),
	// 		});
	// 	};
	// };

	// logInner("log", log, "info");
	// logInner("warn", warn, "warn");
	// logInner("error", error, "error");
	// logInner("debug", debug, "debug");
	// logInner("trace", trace, "trace");
};
