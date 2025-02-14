import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";

const ArticleViewContainer = () => {
	const articleView = ArticleViewService.value;

	return <div style={{ height: "inherit" }}>{articleView}</div>;
};

export default ArticleViewContainer;
