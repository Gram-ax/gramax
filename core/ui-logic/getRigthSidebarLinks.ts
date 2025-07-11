import { feedbackLink } from "@components/libs/utils";
import t from "@ext/localization/locale/translate";
import { TitledLink } from "@ext/navigation/NavigationLinks";
import ArticlePropsService from "./ContextServices/ArticleProps";
import CatalogPropsService from "./ContextServices/CatalogProps";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const divider = {} as TitledLink;

export const useGetArticleLinks = (): TitledLink[] => {
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const links: TitledLink[] = [];

	if (catalogProps.relatedLinks) links.push(...catalogProps.relatedLinks);

	if (catalogProps.contactEmail)
		links.push({
			icon: "mail",
			title: t("comments-to-article"),
			url: feedbackLink(catalogProps.contactEmail, articleProps.logicPath, catalogProps.repositoryName),
		});

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
	// 	title: t("save-catalog-as-docx"),
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
