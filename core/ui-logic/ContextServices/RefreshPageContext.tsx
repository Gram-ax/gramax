import { getExecutingEnvironment } from "@app/resolveModule";
import { ReactElement } from "react";

export const defaultRefreshPage = () => void setTimeout(() => location.reload(), 100);

let _refreshPage = defaultRefreshPage;

export const refreshPage = () => _refreshPage();

export default abstract class RefreshPageService {
	static Provider({ children, refresh: _refresh }: { children: ReactElement; refresh: () => void }): ReactElement {
		_refreshPage = getExecutingEnvironment() === "next" ? () => {} : _refresh ?? defaultRefreshPage;

		return children;
	}
}
