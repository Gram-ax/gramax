import { ArticlePageData } from "../logic/SitePresenter/SitePresenter";

const getPageTitle = (isArticle: boolean, data: ArticlePageData): string =>
	!isArticle ? "Gramax" : joinTitles(data.articleProps.title, data.catalogProps.title);

export const joinTitles = (articleTitle: string, catalogTitle: string): string => articleTitle + " | " + catalogTitle;

export default getPageTitle;
