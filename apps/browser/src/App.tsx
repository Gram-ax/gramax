import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import LanguageService from "@core-ui/ContextServices/Language";
import getPageTitle from "@core-ui/getPageTitle";
import Query, { parserQuery } from "@core/Api/Query";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import ThemeService from "@ext/Theme/components/ThemeService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { useCallback, useEffect, useState } from "react";
import { Router } from "wouter";
import { HistoryProvider } from "../../tauri/src/ForwardBackward";
import Gramax, { GramaxProps } from "./Gramax";
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

const AppContext = () => {
	const [path, setLocation, query] = useLocation();
	const [data, setData] = useState<GramaxProps>();
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

	if (typeof window !== "undefined") {
		window.navigateTo = useCallback(
			(url: string) => {
				window.resetIsFirstLoad();
				if (url == path) {
					refresh();
				} else {
					setData(null);
					window.resetIsFirstLoad();
					setLocation(url);
				}
			},
			[path, refresh, setLocation],
		);
	}

	useEffect(() => {
		if (!data) return;
		document.title = getPageTitle(data.context.isArticle, data.data as any);
	}, [data]);

	useEffect(() => void refresh(), [refresh]);

	if (!data)
		return <ThemeService.Provider>{error ? <AppError error={error} /> : <AppLoader />}</ThemeService.Provider>;

	return (
		<Router hook={() => [data.path, setLocation]}>
			<Gramax data={data} refresh={refresh} setData={setData} />
		</Router>
	);
};

const App = () => {
	return (
		<HistoryProvider>
			<LanguageService.Init>
				<AppContext />
			</LanguageService.Init>
		</HistoryProvider>
	);
};

export default App;
