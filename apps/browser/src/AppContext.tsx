import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import ContextProviders from "@components/ContextProviders";
import getPageTitle from "@core-ui/getPageTitle";
import Query, { parserQuery } from "@core/Api/Query";
import PageDataContext from "@core/Context/PageDataContext";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import Theme from "@ext/Theme/Theme";
import ThemeService from "@ext/Theme/components/ThemeService";
import ErrorBoundary from "@ext/errorHandlers/client/components/ErrorBoundary";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import localizer from "@ext/localization/core/Localizer";
import { useCallback, useEffect, useState } from "react";
import AppError from "./components/Atoms/AppError";
import AppLoader from "./components/Atoms/AppLoader";
import Migrate, { MigrateState } from "./components/Migrate";
import useLocation from "./logic/Api/useLocation";

const getData = async (route: string, query: Query) => {
	const app = await getApp();
	const commands = getCommands(app);
	const lang = localizer.extract(route);
	const path = localizer.trim(route);
	const ctx = app.contextFactory.fromBrowser(lang, query);
	return commands.page.getPageData.do({ ctx, path });
};

const AppContext = ({ children }: { children: (data: any) => JSX.Element }) => {
	const [path, , query] = useLocation();

	const [data, setData] = useState<{
		data: HomePageData | ArticlePageData;
		context: PageDataContext;
		path: string;
	}>();

	const [error, setError] = useState<DefaultError>();
	const [migrateState, setMigrateState] = useState(undefined);

	const refresh = useCallback(async () => {
		try {
			const data = await getData(path, parserQuery(query));
			setData({ path: localizer.trim(path), ...data });
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
		return (
			<ThemeService.Provider value={Theme.light}>
				{error ? <AppError error={error} /> : <AppLoader delayBeforeShow={500} />}
			</ThemeService.Provider>
		);

	if (migrateState !== MigrateState.None && !error)
		return (
			<ThemeService.Provider value={Theme.light}>
				<Migrate state={migrateState} setState={setMigrateState} onDone={refresh} />
			</ThemeService.Provider>
		);

	return (
		<ContextProviders pageProps={data as any} refreshPage={refresh}>
			<ErrorBoundary context={data.context}>{children(data)}</ErrorBoundary>
		</ContextProviders>
	);
};

export default AppContext;
