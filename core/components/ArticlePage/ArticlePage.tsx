import ArticlePreview from "@components/Article/ArticlePreview";
import ArticleWithPreviewArticle from "@components/ArticlePage/ArticleWithPreviewArticle";
import ArticleBreadcrumb from "@components/Breadcrumbs/ArticleBreadcrumb";
import Welcome from "@components/Welcome";
import useShowMainLangContentPreview from "@core-ui/hooks/useShowMainLangContentPreview";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import CreateFirstArticle from "@ext/artilce/actions/CreateFirstArticle";
import t from "@ext/localization/locale/translate";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import interceptPrintShortkeys from "../../extensions/artilce/actions/SaveAsPdf/interceptPrintShortkeys";
import ThemeService from "../../extensions/Theme/components/ThemeService";
import IsMacService from "../../ui-logic/ContextServices/IsMac";
import Article from "../Article/Article";
import ArticleFooter from "@components/Article/ArticleFooter";
import { useEffect } from "react";
import ArticleErrorHandler from "@ext/errorHandlers/client/components/ArticleErrorHandler";

const ArticlePage = ({ data, className }: { data: ArticlePageData; className?: string }) => {
	const theme = ThemeService.value;
	const isMac = IsMacService.value;
	const { clear } = ResourceService.value;
	const isShowMainLangContentPreview = useShowMainLangContentPreview();

	useEffect(() => clear(), [data.articleProps.logicPath]);

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
			<ArticleErrorHandler>
				<ArticleBreadcrumb itemLinks={data.itemLinks} hasPreview={isShowMainLangContentPreview} />
				<ArticleWithPreviewArticle
					mainArticle={<Article data={data} />}
					previewArticle={
						isShowMainLangContentPreview && <ArticlePreview logicPath={data.articleProps.logicPath} />
					}
				/>
				<ArticleFooter logicPath={data.articleProps.logicPath} itemLinks={data.itemLinks} />
			</ArticleErrorHandler>
		</div>
	);
};

export default styled(ArticlePage)`
	display: flex;
	flex-direction: column;
	height: 100%;
`;
