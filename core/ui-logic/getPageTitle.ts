import type { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";

const getPageTitle = (isArticle: boolean, data: HomePageData | ArticlePageData): string =>
	!isArticle
		? "Gramax"
		: joinTitles((data as ArticlePageData).articleProps.title, (data as ArticlePageData).catalogProps.title);

export const joinTitles = (articleTitle: string, catalogTitle: string): string => `${articleTitle} | ${catalogTitle}`;

export default getPageTitle;
