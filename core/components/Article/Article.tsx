import { ArticleEditRenderer, ArticleReadRenderer } from "@components/Article/ArticleRenderer";
import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useArticleScrollPosition from "@core-ui/hooks/useArticleScrollPosition";
import { useCtrlKeyLinkHandler } from "@core-ui/hooks/useCtrlKeyLinkHandler";
import useScrollToArticleAnchor from "@core-ui/hooks/useScrollToArticleAnchor";

const Article = ({ data }: { data: ArticlePageData }) => {
	const pageDataContext = PageDataContextService.value;

	useCtrlKeyLinkHandler(); // For opening links in tauri
	useArticleScrollPosition(data);
	useScrollToArticleAnchor(data);

	if (!pageDataContext.isArticle) return null;

	return data.mode === "read" ? <ArticleReadRenderer data={data} /> : <ArticleEditRenderer data={data} />;
};

export default Article;
