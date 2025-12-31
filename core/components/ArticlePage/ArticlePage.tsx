import ArticleFooter from "@components/Article/ArticleFooter";
import ArticlePreview from "@components/Article/ArticlePreview";
import ArticleWithPreviewArticle from "@components/ArticlePage/ArticleWithPreviewArticle";
import ArticleBreadcrumb from "@components/Breadcrumbs/ArticleBreadcrumb";
import Welcome from "@components/Welcome";
import useShowMainLangContentPreview from "@core-ui/hooks/useShowMainLangContentPreview";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import CreateFirstArticle from "@ext/article/actions/CreateFirstArticle";
import ArticleErrorHandler from "@ext/errorHandlers/client/components/ArticleErrorHandler";
import t from "@ext/localization/locale/translate";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { useEffect } from "react";
import Article from "../Article/Article";
import { cssMedia } from "@core-ui/utils/cssUtils";

const ArticlePage = ({ data, className }: { data: ArticlePageData; className?: string }) => {
	const { clear } = ResourceService.value;
	const isShowMainLangContentPreview = useShowMainLangContentPreview();

	useEffect(() => clear(), [data.articleProps.logicPath]);

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

	${cssMedia.narrow} {
		height: fit-content;
		min-height: 100dvh;
	}
`;
