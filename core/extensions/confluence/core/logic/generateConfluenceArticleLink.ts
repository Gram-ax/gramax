import { ConfluenceArticle } from "@ext/confluence/core/model/ConfluenceArticle";

const generateConfluenceArticleLink = (article: ConfluenceArticle): string => {
	return `${article.domain}/wiki${article.linkUi.replace(/~/g, "%7E")}`;
};

export default generateConfluenceArticleLink;
