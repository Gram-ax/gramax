export const defaultRefreshPage = () => void setTimeout(() => location.reload(), 100);
export const defaultClearData = null;

const w = typeof window == "undefined" ? ({} as any) : (window as any);

w.refreshPage = defaultRefreshPage;
w.clearData = defaultClearData;

export const refreshPage = () => w.refreshPage();
export const clearData = () => w.clearData();

export const initRefresh = (refresh: () => void, clearData: () => void) => {
	w.refreshPage = refresh ?? defaultRefreshPage;
	w.clearData = clearData ?? defaultClearData;
};
