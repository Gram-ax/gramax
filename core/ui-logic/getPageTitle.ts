import { ArticleData } from "../logic/SitePresenter/SitePresenter";

const getPageTitle = (isArticle: boolean, data: ArticleData): string =>
	!isArticle ? "Gramax" : data.articleProps.title + " | " + data.catalogProps.title;

export default getPageTitle;
