import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";

const ArticleViewContainer = () => {
	const articleView = ArticleViewService.value;
	return articleView;
};

export default ArticleViewContainer;
