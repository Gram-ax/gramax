import ContextProviders from "@components/ContextProviders";
import type { PageProps } from "@components/Pages/models/Pages";
import getPageTitle from "@core-ui/getPageTitle";
import ErrorBoundary from "@ext/errorHandlers/client/components/ErrorBoundary";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { useApplyTheme } from "@ext/Theme/utils";
import { usePluginEvent } from "@plugins/api/events";
import { useCallback, useEffect, useRef, useState } from "react";
import { Router } from "wouter";
import { DocportalPage } from "../../../../core/components/Pages/components/DocportalPage";
import AppError from "../../../web/src/components/Atoms/AppError";
import useLocation from "../../../web/src/logic/Api/useLocation";
import { getBasePath, prependBasePath, stripBasePath } from "../logic/basePath";

interface AppProps {
	initialData: PageProps;
}

const fetchPageData = async (path: string): Promise<PageProps> => {
	const URLParams = new URLSearchParams();
	URLParams.set("path", path);
	URLParams.set("mode", "read");

	const res = await fetch(`${getBasePath()}/api/page/getPageData?${URLParams.toString()}`);
	if (!res.ok) throw new Error(`Failed to fetch page data: ${res.status}`);
	return res.json();
};

export const App = ({ initialData }: AppProps) => {
	const basePath = getBasePath();
	const isFirstLoad = useRef<boolean>(true);
	const [rawPath, rawSetLocation] = useLocation();
	const path = stripBasePath(rawPath);
	const setLocation = useCallback(
		(url: string, opts?: { replace?: boolean }) => rawSetLocation(prependBasePath(url), opts),
		[rawSetLocation],
	);
	const [pageData, setPageData] = useState<PageProps>(initialData);
	const [error, setError] = useState<DefaultError>(null);

	const refresh = useCallback(async () => {
		if (typeof window !== "undefined") window.onNavigate?.(path);
		try {
			const newData = await fetchPageData(path);
			setPageData(newData);
			if (newData) document.title = getPageTitle(newData);
		} catch (err) {
			console.error("failed to get page data", err);
			setError(err);
		}
	}, [path]);

	const navigateTo = useCallback(
		(url: string) => {
			if (typeof window === "undefined") return;
			window.resetIsFirstLoad?.();
			if (url === path) void refresh();
			else setLocation(url);
		},
		[path, refresh, setLocation],
	);

	useEffect(() => {
		if (typeof window !== "undefined") {
			window.navigateTo = navigateTo;
		}
	}, [navigateTo]);

	useEffect(() => {
		if (isFirstLoad.current) isFirstLoad.current = false;
		else void refresh();
	}, [refresh]);

	useApplyTheme();
	usePluginEvent("app:open", { ...pageData, path });
	usePluginEvent("app:close");

	if (error) {
		return <AppError error={error} />;
	}

	return (
		<ContextProviders pageProps={pageData} platform="next" refreshPage={refresh}>
			<ErrorBoundary context={pageData.context}>
				<Router base={basePath} hook={() => [path, setLocation]}>
					<DocportalPage data={pageData} />
				</Router>
			</ErrorBoundary>
		</ContextProviders>
	);
};
