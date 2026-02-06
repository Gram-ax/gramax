import { ArticleEditRenderer, ArticleReadRenderer } from "@components/Article/ArticleRenderer";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCtrlKeyLinkHandler } from "@core-ui/hooks/useCtrlKeyLinkHandler";
import useScrollToArticleAnchor from "@core-ui/hooks/useScrollToArticleAnchor";

const Article = ({ data }: { data: ArticlePageData }) => {
	const { articleProps } = data;
	const pageDataContext = PageDataContextService.value;

	useCtrlKeyLinkHandler(); // For opening links in tauri
	useScrollToArticleAnchor(data); // For scrolling to article header

	if (!pageDataContext.isArticle) return null;

	const isRenderMode = pageDataContext.conf.isReadOnly || articleProps.errorCode;

	return isRenderMode ? <ArticleReadRenderer data={data} /> : <ArticleEditRenderer data={data} />;
};

export default Article;
