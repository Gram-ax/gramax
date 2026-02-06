import { feedbackLink } from "@components/libs/utils";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import t from "@ext/localization/locale/translate";
import { TitledLink } from "@ext/navigation/NavigationLinks";
import ArticlePropsService from "./ContextServices/ArticleProps";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const divider = {} as TitledLink;

export const useGetArticleLinks = (): TitledLink[] => {
	const articleProps = ArticlePropsService.value;
	const { relatedLinks, contactEmail, repositoryName } = useCatalogPropsStore(
		(state) => ({
			relatedLinks: state.data.relatedLinks,
			contactEmail: state.data.contactEmail,
			repositoryName: state.data.repositoryName,
		}),
		"shallow",
	);

	const links: TitledLink[] = [];

	if (relatedLinks) links.push(...relatedLinks);

	if (contactEmail)
		links.push({
			icon: "mail",
			title: t("comments-to-article"),
			url: feedbackLink(contactEmail, articleProps.logicPath, repositoryName),
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
