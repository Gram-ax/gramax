import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";

const ArticleViewContainer = () => {
	const articleView = ArticleViewService.value;
	const useDefaultStyles = ArticleViewService.useArticleDefaultStyles;
	return (
		<div style={{ height: "inherit" }}>
			{articleView}
			{!useDefaultStyles && <div style={{ width: "100%", height: "30px" }} />}
		</div>
	);
};

export default ArticleViewContainer;
