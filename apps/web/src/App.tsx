import getApp from "@app/web/app";
import getCommands from "@app/web/commands";
import type Query from "@core/Api/Query";
import { parserQuery } from "@core/Api/Query";
import { Router as BaseRouter } from "@core/Api/Router";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import getPageTitle from "@core-ui/getPageTitle";
import { emitApiEvent } from "@core-ui/hooks/useApi";
import preventFileDropNavigation from "@core-ui/utils/preventFileDropNavigation";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { span } from "@ext/loggers/opentelemetry";
import { feature } from "@ext/toggleFeatures/features";
import { usePluginEvent } from "@plugins/api/events";
import { loadRouteWorkspacePlugins } from "@plugins/index";
import { Toaster, toast } from "@ui-kit/Toast";
import { useCallback, useEffect, useRef, useState } from "react";
import { Router } from "wouter";
import AppError from "./components/Atoms/AppError";
import AppLoader from "./components/Atoms/AppLoader";
import Gramax, { type GramaxData } from "./Gramax";
import useLocation from "./logic/Api/useLocation";
// biome-ignore lint/style/noRestrictedImports: CSS-only import for theme variables
import "ics-ui-kit/theme.css";
import "../../../core/ui-kit/index.css";
import { getQueryForDiffFromCatalogName } from "@ext/git/actions/Revisions/logic/utils/getQueryForDiffFromCatalogName";
import { useApplyTheme } from "@ext/Theme/utils";

const getData = async (route: string, query: Query) => {
	const app = await getApp();
	const commands = getCommands(app);
	await loadRouteWorkspacePlugins({
		route,
		app,
		commands,
		onPluginLoadError: (pluginName) =>
			toast(t("plugins.messages.load-error").replace("{name}", pluginName), { status: "error" }),
		onError: (error) => span()?.recordException(error as Error),
	});
	const language = RouterPathProvider.parsePath(route).language;
	const ctx = await app.contextFactory.fromWeb({
		language,
		query,
	});

	const optionsForDiff = getQueryForDiffFromCatalogName(route, query);
	const mode = query.mode as ArticlePageData["mode"];

	const data = await commands.page.getPageData.do({
		ctx,
		path: route,
		options: {
			mode,
			...(optionsForDiff ? optionsForDiff : {}),
		},
	});
	emitApiEvent("on-did-command", { command: commands.page.getPageData.path, args: { path: route }, result: null });
	return data;
};

// used for handling opening urls of cloning catalogs; we don't want to open them yet
const filterOutPageData = (data: ArticlePageData, setLocation: (path: string) => void) => {
	if (data?.catalogProps?.link?.isCloning) {
		setLocation("/");
		return true;
	}

	return false;
};

const getIsPreventNextPushRefresh = () => {
	if (BaseRouter.preventNextPushRefresh) {
		BaseRouter.preventNextPushRefresh = false;
		return true;
	}
	return false;
};

const AppContext = () => {
	const [path, setLocation, query] = useLocation();
	const [data, setData] = useState<GramaxData>();
	const [error, setError] = useState<DefaultError>();
	const refreshCounterRef = useRef(0);

	useApplyTheme();

	const refresh = useCallback(async () => {
		const requestId = ++refreshCounterRef.current;
		window.onNavigate?.(path);
		try {
			const data = await getData(path, parserQuery(query));

			if (requestId !== refreshCounterRef.current) return;

			if (getIsPreventNextPushRefresh() || filterOutPageData(data?.data as ArticlePageData, setLocation)) return;

			setData({ path, ...data });

			if (data) document.title = getPageTitle(data);
		} catch (err) {
			if (requestId !== refreshCounterRef.current) return;
			console.error("failed to get page data", err);
			setError(err);
		}
	}, [path, setLocation, query]);

	if (typeof window !== "undefined") {
		window.navigateTo = useCallback(
			(url: string) => {
				window.resetIsFirstLoad();
				if (url === path) {
					void refresh();
				} else {
					setData(undefined);
					window.resetIsFirstLoad();
					setLocation(url);
				}
			},
			[path, refresh, setLocation],
		);
	}

	useEffect(() => void refresh(), [refresh]);

	usePluginEvent("app:open", data);
	usePluginEvent("app:close");

	if (!data) return error ? <AppError error={error} /> : <AppLoader />;

	return (
		<Router hook={() => [data.path, setLocation]}>
			<Gramax data={data} refresh={refresh} setData={setData} />
		</Router>
	);
};

const App = () => {
	useEffect(() => {
		preventFileDropNavigation();
	}, []);

	return (
		<>
			<Toaster />
			<AppContext />
		</>
	);
};

export default App;
