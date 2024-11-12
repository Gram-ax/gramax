import { ArticleEditRenderer, ArticleReadRenderer } from "@components/Article/ArticleRenderer";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCtrlKeyLinkHandler } from "@core-ui/hooks/useCtrlKeyLinkHandler";
import useScrollToArticleAnchor from "@core-ui/hooks/useScrollToArticleAnchor";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import ErrorHandler from "@ext/errorHandlers/client/components/ErrorHandler";
import t from "@ext/localization/locale/translate";

const Article = ({ data }: { data: ArticlePageData }) => {
	const pageDataContext = PageDataContextService.value;
	useCtrlKeyLinkHandler(); // Для открытия ссылок в tauri
	useScrollToArticleAnchor(data); // Для скрола до заголовка в статье

	return (
		<ErrorHandler alertTitle={t("article.error.render-failed")} isAlert>
			{pageDataContext.conf.isReadOnly ? (
				<ArticleReadRenderer data={data} />
			) : (
				<ArticleEditRenderer data={data} />
			)}
		</ErrorHandler>
	);
};
export default Article;
