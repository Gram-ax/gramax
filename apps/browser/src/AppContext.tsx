import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import ContextProviders from "@components/ContextProviders";
import getPageTitle from "@core-ui/getPageTitle";
import Query, { parserQuery } from "@core/Api/Query";
import PageDataContext from "@core/Context/PageDataContext";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import ThemeService from "@ext/Theme/components/ThemeService";
import ErrorBoundary from "@ext/errorHandlers/client/components/ErrorBoundary";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { useCallback, useEffect, useState } from "react";
import AppError from "./components/Atoms/AppError";
import AppLoader from "./components/Atoms/AppLoader";
import useLocation from "./logic/Api/useLocation";

const getData = async (route: string, query: Query) => {
	const app = await getApp();
	const commands = getCommands(app);
	const lang = RouterPathProvider.parsePath(route).language;
	const ctx = await app.contextFactory.fromBrowser(lang, query);
	return commands.page.getPageData.do({ ctx, path: route });
};

const AppContext = ({ children }: { children: (data: any) => JSX.Element }) => {
	const [path, setLocation, query] = useLocation();

	const [data, setData] = useState<{
		data: HomePageData | ArticlePageData;
		context: PageDataContext;
		path: string;
	}>();

	if (typeof window !== "undefined")
		window.navigateTo = (url: string) => {
			window.resetIsFirstLoad();
			if (url == path) {
				refresh();
			} else {
				setData(null);
				window.resetIsFirstLoad();
				setLocation(url);
			}
		};

	const [error, setError] = useState<DefaultError>();

	const refresh = useCallback(async () => {
		try {
			const data = await getData(path, parserQuery(query));
			setData({ path, ...data });
		} catch (err) {
			console.error(err);
			setError(err);
		}
	}, [path, query]);

	useEffect(() => {
		if (!data) return;
		document.title = getPageTitle(data.context.isArticle, data.data as any);
	}, [data]);

	useEffect(() => void refresh(), [refresh]);

	if (!data)
		return <ThemeService.Provider>{error ? <AppError error={error} /> : <AppLoader />}</ThemeService.Provider>;

	return (
		<ContextProviders
			pageProps={data as any}
			refreshPage={refresh}
			clearData={() => {
				const prev = data;
				setTimeout(() => setData((data) => (data == prev ? null : data)), 500);
			}}
		>
			<ErrorBoundary context={data.context}>{children(data)}</ErrorBoundary>
		</ContextProviders>
	);
};

export default AppContext;
