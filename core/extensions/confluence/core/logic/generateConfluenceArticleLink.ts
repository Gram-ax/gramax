import { ConfluenceArticle } from "@ext/confluence/core/model/ConfluenceArticle";

const generateConfluenceArticleLink = (article: ConfluenceArticle, isCloud = true): string => {
	return `${article.domain}${isCloud ? "/wiki" : ""}${article.linkUi.replace(/~/g, "%7E")}`;
};

export default generateConfluenceArticleLink;
