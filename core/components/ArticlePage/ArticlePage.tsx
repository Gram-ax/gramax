import ArticleFooter from "@components/Article/ArticleFooter";
import ArticlePreview from "@components/Article/ArticlePreview";
import ArticleWithPreviewArticle from "@components/ArticlePage/ArticleWithPreviewArticle";
import ArticleBreadcrumb from "@components/Breadcrumbs/ArticleBreadcrumb";
import Welcome from "@components/Welcome";
import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import useShowMainLangContentPreview from "@core-ui/hooks/useShowMainLangContentPreview";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import CreateFirstArticle from "@ext/article/actions/CreateFirstArticle";
import ArticleErrorHandler from "@ext/errorHandlers/client/components/ArticleErrorHandler";
import t from "@ext/localization/locale/translate";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { useEffect } from "react";
import Article from "../Article/Article";

const ArticlePage = ({ data, className }: { data: ArticlePageData; className?: string }) => {
	const { clear } = ResourceService.value;
	const isShowMainLangContentPreview = useShowMainLangContentPreview();

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => clear(), [data.articleProps.logicPath]);

	if (data.articleProps.welcome)
		return (
			<Welcome
				actions={<CreateFirstArticle data={data} />}
				article
				body={<span>{t("article.create.body")}</span>}
				title={t("so-far-its-empty")}
			/>
		);

	return (
		<div className={className}>
			<ArticleErrorHandler>
				<ArticleBreadcrumb hasPreview={isShowMainLangContentPreview} itemLinks={data.itemLinks} />
				<ArticleWithPreviewArticle
					mainArticle={<Article data={data} />}
					previewArticle={
						isShowMainLangContentPreview && <ArticlePreview logicPath={data.articleProps.logicPath} />
					}
				/>
				<ArticleFooter itemLinks={data.itemLinks} />
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
