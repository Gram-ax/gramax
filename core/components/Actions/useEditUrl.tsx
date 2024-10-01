import { getExecutingEnvironment } from "@app/resolveModule/env";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useEffect, useState } from "react";

const useEditUrlInDesktop = () => "gramax://" + window.location.pathname;

const useEditUrlInWeb = () =>
	(PageDataContextService.value?.conf.isRelease ? "https://app.gram.ax" : "https://dev.gram.ax") +
	window.location.pathname +
	"/?web";

const useEditUrlInWebFromDocPortal = () => {
	const [editInGramaxUrl, setEditInGramaxUrl] = useState<string>();

	const catalogProps = CatalogPropsService.value;
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isRelease = PageDataContextService.value?.conf.isRelease;

	const getEditInGramaxLink = async () => {
		const res = await FetchService.fetch(apiUrlCreator.getEditOnAppUrl(articleProps.ref.path));
		if (!res.ok) return;
		setEditInGramaxUrl((isRelease ? "https://app.gram.ax/" : "https://dev.gram.ax/") + (await res.text()));
	};

	useEffect(() => {
		void getEditInGramaxLink();
	}, [catalogProps.name, articleProps.logicPath]);

	return editInGramaxUrl;
};

const editUrlHooks = {
	next: useEditUrlInWebFromDocPortal,
	browser: useEditUrlInDesktop,
	tauri: useEditUrlInWeb,
};

const useEditUrl = () => editUrlHooks[getExecutingEnvironment()]();

export default useEditUrl;
