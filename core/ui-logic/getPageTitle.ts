import { ArticlePageData } from "../logic/SitePresenter/SitePresenter";

const getPageTitle = (isArticle: boolean, data: ArticlePageData): string =>
	!isArticle ? "Gramax" : data.articleProps.title + " | " + data.catalogProps.title;

export default getPageTitle;
