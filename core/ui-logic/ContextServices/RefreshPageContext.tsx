import { ReactElement } from "react";

export const defaultRefreshPage = () => void setTimeout(() => location.reload(), 100);

const w = typeof window == "undefined" ? ({} as any) : (window as any);

w.refreshPage = defaultRefreshPage;

export const refreshPage = () => w.refreshPage();

export default abstract class RefreshPageService {
	static Provider({
		children,
		refresh: _refresh,
	}: {
		children: ReactElement;
		refresh: () => Promise<void>;
	}): ReactElement {
		w.refreshPage = _refresh ?? defaultRefreshPage;
		return children;
	}
}
