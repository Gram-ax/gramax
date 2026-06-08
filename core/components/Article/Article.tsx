import { ArticleComponent } from "@components/Article/ArticleComponent";
import type {
	ArticlePageData,
	DiffArticlePageData,
	EditArticlePageData,
	MarkdownArticlePageData,
	ReadonlyArticlePageData,
} from "@core/SitePresenter/types/ArticlePage";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useArticleScrollPosition from "@core-ui/hooks/useArticleScrollPosition";
import { useCtrlKeyLinkHandler } from "@core-ui/hooks/useCtrlKeyLinkHandler";
import useScrollToArticleAnchor from "@core-ui/hooks/useScrollToArticleAnchor";
import { useAutoFocusArticle } from "@ext/article/hooks/useAutoFocusArticle";

type ArticlePageDataMap = {
	edit: EditArticlePageData;
	read: ReadonlyArticlePageData;
	markdown: MarkdownArticlePageData;
	diff: DiffArticlePageData;
};

export interface ArticleComponentProps<T extends ArticlePageData["mode"]> {
	data: ArticlePageDataMap[T];
	isReadOnly: boolean;
}

const Article = ({ data }: { data: ArticlePageData }) => {
	const pageDataContext = PageDataContextService.value;

	useCtrlKeyLinkHandler(); // For opening links in tauri
	useAutoFocusArticle();
	useArticleScrollPosition(data);
	useScrollToArticleAnchor(data);

	if (!pageDataContext.isArticle) return null;

	return <ArticleComponent data={data} isReadOnly={pageDataContext.conf.isReadOnly} />;
};

export default Article;
