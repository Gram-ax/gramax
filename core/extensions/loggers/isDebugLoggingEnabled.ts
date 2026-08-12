export const isDebugLoggingEnabled = () => {
	if (typeof process === "undefined") return false;
	const logLevel = process.env.LOG_LEVEL?.toLowerCase();
	return logLevel === "debug" || logLevel === "trace";
};
