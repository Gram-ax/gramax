import { ReactElement } from "react";

export const defaultRefreshPage = () => void setTimeout(() => location.reload(), 100);
export const defaultClearData = null;

const w = typeof window == "undefined" ? ({} as any) : (window as any);

w.refreshPage = defaultRefreshPage;
w.clearData = defaultClearData;

export const refreshPage = () => w.refreshPage();
export const clearData = () => w.clearData();

export default abstract class RefreshPageService {
	static Provider({
		children,
		refresh: _refresh,
		clearData: _clearData,
	}: {
		children: ReactElement;
		refresh: () => Promise<void> | void;
		clearData: () => void;
	}): ReactElement {
		w.refreshPage = _refresh ?? defaultRefreshPage;
		w.clearData = _clearData ?? defaultClearData;
		return children;
	}
}
