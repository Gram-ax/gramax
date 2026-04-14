import ContextProviders from "@components/ContextProviders";
import type { PageProps } from "@components/Pages/models/Pages";
import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import getPageTitle from "@core-ui/getPageTitle";
import ErrorBoundary from "@ext/errorHandlers/client/components/ErrorBoundary";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { usePluginEvent } from "@plugins/api/events";
import { usePluginLoader } from "@plugins/index";
import AppError from "apps/browser/src/components/Atoms/AppError";
import useLocation from "apps/browser/src/logic/Api/useLocation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Router } from "wouter";
import { DocportalPage } from "../../../../core/components/Pages/components/DocportalPage";

interface AppProps {
	initialData: PageProps;
}

const fetchPageData = async (path: string): Promise<PageProps> => {
	const res = await fetch(`/api/page/getPageData?path=${encodeURIComponent(path)}`);
	if (!res.ok) throw new Error(`Failed to fetch page data: ${res.status}`);
	return res.json();
};

export function App({ initialData }: AppProps) {
	const isFirstLoad = useRef<boolean>(true);
	const [path, setLocation] = useLocation();
	const [pageData, setPageData] = useState<PageProps>(initialData);
	const [error, setError] = useState<DefaultError>(null);

	const refresh = useCallback(async () => {
		if (typeof window !== "undefined") window.onNavigate?.(path);
		try {
			const newData = await fetchPageData(path);
			setPageData(newData);
			if (newData) document.title = getPageTitle(newData.context.isArticle, newData.data as ArticlePageData);
		} catch (err) {
			console.error("failed to get page data", err);
			setError(err);
		}
	}, [path]);

	const navigateTo = useCallback(
		(url: string) => {
			if (typeof window === "undefined") return;
			window.resetIsFirstLoad?.();
			if (url === path) refresh();
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

	usePluginLoader({
		basePath: pageData?.context?.conf?.basePath ?? "",
		workspacePath: pageData?.context?.workspace.current,
		gesUrl: pageData?.context?.conf?.enterprise?.gesUrl,
		enabled: !!pageData,
	});

	usePluginEvent("app:open", { ...pageData, path });
	usePluginEvent("app:close");

	if (error) {
		return <AppError error={error} />;
	}

	return (
		<ContextProviders pageProps={pageData} platform="next" refreshPage={refresh}>
			<ErrorBoundary context={pageData.context}>
				<Router hook={() => [path, setLocation]}>
					<DocportalPage data={pageData} />
				</Router>
			</ErrorBoundary>
		</ContextProviders>
	);
}
