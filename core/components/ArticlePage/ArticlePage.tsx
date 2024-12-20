import ArticlePreview from "@components/Article/ArticlePreview";
import ArticleWithPreviewArticle from "@components/ArticlePage/ArticleWithPreviewArticle";
import ArticleBreadcrumb from "@components/Breadcrumbs/ArticleBreadcrumb";
import Welcome from "@components/Welcome";
import useShowMainLangContentPreview from "@core-ui/hooks/useShowMainLangContentPreview";
import useWatch from "@core-ui/hooks/useWatch";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import CreateFirstArticle from "@ext/artilce/actions/CreateFirstArticle";
import t from "@ext/localization/locale/translate";
import { ContentEditorId } from "@ext/markdown/core/edit/components/ContentEditor";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import interceptPrintShortkeys from "../../extensions/artilce/actions/SaveAsPdf/interceptPrintShortkeys";
import NextPrevious from "../../extensions/navigation/NextPrevious";
import ThemeService from "../../extensions/Theme/components/ThemeService";
import IsMacService from "../../ui-logic/ContextServices/IsMac";
import Article from "../Article/Article";
import ArticleExtensions from "../Article/ArticleExtensions";

const ArticlePage = ({ data, className }: { data: ArticlePageData; className?: string }) => {
	const theme = ThemeService.value;
	const isMac = IsMacService.value;
	const { clear } = OnLoadResourceService.value;
	const isShowMainLangContentPreview = useShowMainLangContentPreview();

	useWatch(() => clear(), [data.articleProps.logicPath]);

	interceptPrintShortkeys(isMac, theme);
	if (data.articleProps.welcome)
		return (
			<Welcome
				article
				title={t("so-far-its-empty")}
				body={<span>{t("article.create.body")}</span>}
				actions={<CreateFirstArticle data={data} />}
			/>
		);

	return (
		<div className={className}>
			<ArticleBreadcrumb itemLinks={data.itemLinks} hasPreview={isShowMainLangContentPreview} />
			<ArticleWithPreviewArticle
				mainArticle={<Article data={data} />}
				previewArticle={
					isShowMainLangContentPreview && <ArticlePreview logicPath={data.articleProps.logicPath} />
				}
			/>
			<NextPrevious itemLinks={data.itemLinks} />
			<ArticleExtensions id={ContentEditorId} />
		</div>
	);
};

export default styled(ArticlePage)`
	display: flex;
	flex-direction: column;
	height: 100%;
`;
