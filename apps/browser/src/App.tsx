import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import LanguageService from "@core-ui/ContextServices/Language";
import getPageTitle from "@core-ui/getPageTitle";
import Query, { parserQuery } from "@core/Api/Query";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import ThemeService from "@ext/Theme/components/ThemeService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { usePluginEvent } from "@plugins/api/events";
import { usePluginLoader } from "@plugins/hooks/usePluginLoader";
import { Toaster } from "@ui-kit/Toast";
import { useCallback, useEffect, useState } from "react";
import { Router } from "wouter";
import Gramax, { GramaxData } from "./Gramax";
import AppError from "./components/Atoms/AppError";
import AppLoader from "./components/Atoms/AppLoader";
import useLocation from "./logic/Api/useLocation";

const getData = async (route: string, query: Query) => {
	const app = await getApp();
	const commands = getCommands(app);
	const language = RouterPathProvider.parsePath(route).language;
	const ctx = await app.contextFactory.fromBrowser({
		language,
		query,
	});
	return commands.page.getPageData.do({ ctx, path: route });
};

// used for handling opening urls of cloning catalogs; we don't want to open them yet
const filterOutPageData = (data: ArticlePageData, setLocation: (path: string) => void) => {
	if (data?.catalogProps?.link?.isCloning) {
		setLocation("/");
		return true;
	}

	return false;
};

const AppContext = () => {
	const [path, setLocation, query] = useLocation();
	const [data, setData] = useState<GramaxData>();
	const [error, setError] = useState<DefaultError>();

	const refresh = useCallback(async () => {
		window.onNavigate?.(path);
		try {
			const data = await getData(path, parserQuery(query));
			if (filterOutPageData(data?.data as ArticlePageData, setLocation)) return;
			setData({ path, ...data });

			if (data) document.title = getPageTitle(data.context.isArticle, data.data as any);
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

	const { pluginsLoaded } = usePluginLoader({
		basePath: data?.context?.conf?.basePath ?? "",
		workspacePath: data?.context?.workspace.current,
		gesUrl: data?.context?.conf?.enterprise?.gesUrl,
		enabled: !!data,
	});

	useEffect(() => void refresh(), [refresh]);

	usePluginEvent("app:open", data);
	usePluginEvent("app:close");

	if (!data || !pluginsLoaded)
		return <ThemeService.Provider>{error ? <AppError error={error} /> : <AppLoader />}</ThemeService.Provider>;

	return (
		<Router hook={() => [data.path, setLocation]}>
			<Gramax data={data} refresh={refresh} setData={setData} />
		</Router>
	);
};

const App = () => {
	return (
		<>
			<Toaster />
			<LanguageService.Init>
				<AppContext />
			</LanguageService.Init>
		</>
	);
};

export default App;
