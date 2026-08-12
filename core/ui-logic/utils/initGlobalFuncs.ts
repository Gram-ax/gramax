import { isOtelEnabled, Level, traced } from "@ext/loggers/opentelemetry";

const reload = () => {
	if (typeof process !== "undefined" && process.env.NODE_ENV === "test") return;
	setTimeout(() => typeof window !== "undefined" && window.location.reload(), 100);
};

export const defaultRefreshPage = isOtelEnabled()
	? () =>
			traced(
				"defaultRefreshPage",
				{ level: Level.Commands, omitArgs: true, omitResult: true },
				() => void reload(),
			)
	: reload;

export const defaultClearData = null;

type RefreshGlobals = { refreshPage: () => void; clearData: (() => void) | null };
const w = (typeof window === "undefined" ? {} : window) as unknown as RefreshGlobals;

w.refreshPage = defaultRefreshPage;
w.clearData = defaultClearData;

export const refreshPage = () => w.refreshPage();
export const clearData = () => w.clearData();

export const initRefresh = (refresh: () => void, clearData: () => void) => {
	w.refreshPage = refresh
		? () => traced("refreshPage", { level: Level.Commands, omitArgs: true, omitResult: true }, refresh)
		: defaultRefreshPage;
	w.clearData = clearData
		? () => traced("clearData", { level: Level.Commands, omitArgs: true, omitResult: true }, clearData)
		: defaultClearData;
};
