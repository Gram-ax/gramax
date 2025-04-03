import { ArticleEditRenderer, ArticleReadRenderer } from "@components/Article/ArticleRenderer";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCtrlKeyLinkHandler } from "@core-ui/hooks/useCtrlKeyLinkHandler";
import useScrollToArticleAnchor from "@core-ui/hooks/useScrollToArticleAnchor";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import ErrorHandler from "@ext/errorHandlers/client/components/ErrorHandler";
import t from "@ext/localization/locale/translate";

const Article = ({ data }: { data: ArticlePageData }) => {
	const { articleProps } = data;
	const pageDataContext = PageDataContextService.value;

	useCtrlKeyLinkHandler(); // For opening links in tauri
	useScrollToArticleAnchor(data); // For scrolling to article header
	const isRenderMode = pageDataContext.conf.isReadOnly || articleProps.errorCode;

	return (
		<ErrorHandler alertTitle={t("article.error.render-failed")} isAlert>
			{isRenderMode ? <ArticleReadRenderer data={data} /> : <ArticleEditRenderer data={data} />}
		</ErrorHandler>
	);
};

export default Article;
