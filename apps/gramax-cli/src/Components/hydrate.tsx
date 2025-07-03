import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { useCallback, useEffect, useRef, useState } from "react";

import { InitialData } from "../logic/ArticleTypes";
import { InitialDataKeys } from "../logic/StaticSiteBuilder";
import useLocation from "../../../browser/src/logic/Api/useLocation";
import AppError from "../../../browser/src/components/Atoms/AppError";
import Gramax, { GramaxProps } from "../../../browser/src/Gramax";

import Application from "@app/types/Application";
import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import { AppConfig } from "@app/config/AppConfig";
import { initModules } from "@app/resolveModule/frontend";
import Query, { parserQuery } from "@core/Api/Query";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import { HomePageData } from "@core/SitePresenter/SitePresenter";
import getPageTitle from "@core-ui/getPageTitle";

import ThemeService from "@ext/Theme/components/ThemeService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";

import "ics-ui-kit/styles.css";
import "../../../../core/styles/ProseMirror.css";
import "../../../../core/styles/admonition.css";
import "../../../../core/styles/article-alfabeta.css";
import "../../../../core/styles/article.css";
import "../../../../core/styles/global.css";
import "../../../../core/styles/swagger-ui-theme.css";

if (window.location.pathname.length > 1 && window.location.pathname.endsWith("/")) {
	const newPath = window.location.pathname.slice(0, -1);
	const newUrl = newPath + window.location.search + window.location.hash;
	window.history.replaceState(null, "", newUrl);
}

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
	base: new Path(new URL(document.baseURI).pathname),
	data: new Path("/"),
	default: new Path("/"),
	root: new Path("/"),
};

const promisedApp: Promise<Application> = (async () => {
	return await getApp();
})();

const getData = async (route: string, query: Query) => {
	const app = await promisedApp;
	const commands = getCommands(app);
	const lang = RouterPathProvider.parsePath(route).language;
	const ctx = await app.contextFactory.fromBrowser(lang, query);
	return commands.page.getPageData.do({ ctx, path: route });
};

const removeBasePath = (path: string) => {
	const basePath = (global.config as AppConfig).paths.base.value;
	return path.startsWith(basePath) ? path.slice(basePath.length) : path;
};

const Component = () => {
	const isFirstRender = useRef(true);
	const [path, setLocation, query] = useLocation();
	const [data, setData] = useState<GramaxProps>({
		path,
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
			const cleanPath = removeBasePath(path);
			const data = await getData(cleanPath, parserQuery(query));
			setData({ path, ...data });
		} catch (err) {
			console.error(err);
			setError(err);
		}
	}, [path, query]);

	useEffect(() => {
		document.title = getPageTitle(data.context.isArticle, data.data as any);
	}, [data]);

	useEffect(() => void refresh(), [refresh]);

	if (error)
		return (
			<ThemeService.Provider>
				<AppError error={error} />
			</ThemeService.Provider>
		);

	return (
		<Router hook={() => [data.path, setLocation]} base={(global.config as AppConfig).paths.base.value}>
			<Gramax data={data} refresh={refresh} setData={() => {}} platform="static" />
		</Router>
	);
};

const root = createRoot(document.getElementById("root"));

initModules().then(() => root.render(<Component />));
