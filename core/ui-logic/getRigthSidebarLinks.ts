import { getExecutingEnvironment } from "@app/resolveModule";
import { feedbackLink } from "../components/libs/utils";
import useLocalize from "../extensions/localization/useLocalize";
import { TitledLink } from "../extensions/navigation/NavigationLinks";
import SourceType from "../extensions/storage/logic/SourceDataProvider/model/SourceType";
import getPartSourceDataByStorageName from "../extensions/storage/logic/utils/getPartSourceDataByStorageName";
import useIsReview from "../extensions/storage/logic/utils/useIsReview";
import FetchService from "./ApiServices/FetchService";
import ApiUrlCreatorService from "./ContextServices/ApiUrlCreator";
import ArticlePropsService from "./ContextServices/ArticleProps";
import CatalogPropsService from "./ContextServices/CatalogProps";
import PageDataContextService from "./ContextServices/PageDataContext";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const divider = {} as TitledLink;

export const getArticleLinks = (isLogged: boolean, IsServerApp: boolean): TitledLink[] => {
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isAppReadOnly = PageDataContextService.value.conf.isReadOnly;
	const neededToBeLogged = (isLogged && isAppReadOnly) || !isAppReadOnly;
	const { sourceType } = getPartSourceDataByStorageName(catalogProps.sourceName);
	const isReview = useIsReview();
	const links: TitledLink[] = [];

	if (catalogProps.relatedLinks) links.push(...catalogProps.relatedLinks);

	if (catalogProps.contactEmail)
		links.push({
			icon: "envelope",
			title: useLocalize("commentsToArticle"),
			url: feedbackLink(catalogProps.contactEmail, articleProps.path, catalogProps.repositoryName),
		});

	if (neededToBeLogged && !!catalogProps.sourceName && sourceType === SourceType.gitLab && !isReview) {
		const url = apiUrlCreator.getFileLink(articleProps.ref.path);
		const isNext = getExecutingEnvironment() == "next";
		links.push({
			icon: "pencil-alt",
			title: useLocalize("editOnGitLab"),
			url: isNext ? url.toString() : null,
			onClick: () => {
				if (isNext) return;
				void FetchService.fetch(url);
			},
			target: "_blank",
		});
	}

	if (!IsServerApp && !isAppReadOnly && !isReview && getExecutingEnvironment() == "tauri") {
		links.push({
			icon: "display-code",
			title: useLocalize("editOnVSCode"),
			onClick: () => void FetchService.fetch(apiUrlCreator.getRedirectVScodeUrl()),
		});
	}
	// if (!sidebarsIsExpand) {
	// 	links.push({
	// 		icon: "file-word",
	// 		title: LocalizationManager.localize("saveAsDOCX") + ": ",
	// 		childrens: [
	// 			{
	// 				url: articleSaveHtmlUrl,
	// 				title: LocalizationManager.localize("article"),
	// 			},
	// 			{
	// 				url: ApiClient.getWordSaveUrl(true, data.catalogProps.name, data.catalogProps.name),
	// 				title: LocalizationManager.localize("allCatalog"),
	// 			},
	// 		],
	// 	});
	// }

	// if (links.length) links.splice(catalogProps.relatedLinks ? 1 : 0, 0, divider);

	return links;
};

export const getCatalogLinks = (): TitledLink[] => {
	// const catalogProps = CatalogPropsService.value;
	// const apiUrlCreator = ApiUrlCreatorService.value;

	const links: TitledLink[] = [];

	// links.push({
	// 	icon: "file-word",
	// 	title: useLocalize("saveCatalogAsDOCX"),
	// 	onClick: () => {
	// 		const fetchData = async () => {
	// 			const res = await FetchService.fetch(apiUrlCreator.getWordSaveUrl());
	// 			if (!res.ok) return;
	// 			downloadFile(res.body, MimeTypes.docx, catalogProps.name);
	// 		};

	// 		void fetchData();
	// 	},
	// });

	// links.push(divider);

	return links;
};
