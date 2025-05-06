import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useEffect, useState } from "react";

const useEditUrlInDesktop = ({ pathname }: { pathname: string }) => "gramax://" + pathname;

const useEditUrlInWeb = ({ pathname }: { pathname: string }) =>
	(PageDataContextService.value?.conf.isRelease ? "https://app.gram.ax/" : "https://dev.gram.ax/") +
	pathname +
	"/?web";

const useEditUrlInWebFromDocPortal = ({ articlePath }: { articlePath: string }) => {
	const [editInGramaxUrl, setEditInGramaxUrl] = useState<string>();

	const catalogProps = CatalogPropsService.value;
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isRelease = PageDataContextService.value?.conf.isRelease;

	const getEditInGramaxLink = async () => {
		const res = await FetchService.fetch(apiUrlCreator.getEditOnAppUrl(articlePath));
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

const useEditUrl = (pathname: string, articlePath: string) => {
	const { environment } = usePlatform();
	return editUrlHooks[environment]({ pathname, articlePath });
};

export default useEditUrl;
