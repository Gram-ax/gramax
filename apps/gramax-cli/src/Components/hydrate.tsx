import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App, { AppProps } from "./App";

import useLocation from "../../../browser/src/logic/Api/useLocation";

import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import { AppConfig } from "@app/config/AppConfig";
import { initModules } from "@app/resolveModule/frontend";
import Query, { parserQuery } from "@core/Api/Query";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import { HomePageData } from "@core/SitePresenter/SitePresenter";
import ThemeService from "@ext/Theme/components/ThemeService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import { useCallback, useEffect, useRef, useState } from "react";
import "../../../../core/styles/ProseMirror.css";
import "../../../../core/styles/admonition.css";
import "../../../../core/styles/article-alfabeta.css";
import "../../../../core/styles/article.css";
import "../../../../core/styles/global.css";
import "../../../../core/styles/swagger-ui-theme.css";
import AppError from "../../../browser/src/components/Atoms/AppError";
import { InitialData } from "../logic/ArticleTypes";
import { InitialDataKeys } from "../logic/StaticSiteBuilder";

const initialData: InitialData = (window as any)[InitialDataKeys.DATA];
if (initialData.context.isArticle && initialData.data?.articlePageData?.articleProps?.errorCode === 404) {
	const article404 = new CustomArticlePresenter().getArticle("Article404", {
		pathname: window.location.pathname,
	});
	initialData.data.articlePageData.articleContentRender = JSON.stringify(
		(await new MarkdownParser().parse(article404.content)).renderTree,
	);
	initialData.data.articlePageData.articleProps.title = article404.getTitle();
}
global.config = (window as any)[InitialDataKeys.CONFIG] as AppConfig;
(global.config as AppConfig).paths = {
	base: new Path("/"),
	data: new Path("/"),
	default: new Path("/"),
	root: new Path("/"),
};

const getData = async (route: string, query: Query) => {
	const app = await getApp();
	const commands = getCommands(app);
	const lang = RouterPathProvider.parsePath(route).language;
	const ctx = await app.contextFactory.fromBrowser(lang, query);
	return commands.page.getPageData.do({ ctx, path: route });
};

const Component = () => {
	const isFirstRender = useRef(true);
	const [path, , query] = useLocation();
	const [data, setData] = useState<Omit<AppProps, "platform">>({
		data: initialData.context.isArticle
			? {
					articleContentEdit: "",
					...initialData.data.articlePageData,
					catalogProps: initialData.data.catalogProps,
			  }
			: (initialData.data as any as HomePageData),
		context: initialData.context,
	});
	const [error, setError] = useState<DefaultError>();

	const refresh = useCallback(async () => {
		try {
			if (isFirstRender.current) {
				isFirstRender.current = false;
				return;
			}
			const data = await getData(path, parserQuery(query));
			setData({ ...data } as AppProps);
		} catch (err) {
			console.error(err);
			setError(err);
		}
	}, [path, query]);

	useEffect(() => void refresh(), [refresh]);

	if (error)
		return (
			<ThemeService.Provider>
				<AppError error={error} />
			</ThemeService.Provider>
		);

	return <App data={data.data} refreshPage={refresh} context={data.context} platform="static" />;
};

const root = createRoot(document.getElementById("root")!);

initModules().then(() =>
	root.render(
		<BrowserRouter>
			<Component />
		</BrowserRouter>,
	),
);
