import { classNames } from "@components/libs/classNames";
import Welcome from "@components/Welcome";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import CreateFirstArticle from "@ext/artilce/actions/CreateFirstArticle";
import t from "@ext/localization/locale/translate";
import { ContentEditorId } from "@ext/markdown/core/edit/components/ContentEditor";
import interceptPrintShortkeys from "../../extensions/artilce/actions/SaveAsPdf/interceptPrintShortkeys";
import NextPrevious from "../../extensions/navigation/NextPrevious";
import ThemeService from "../../extensions/Theme/components/ThemeService";
import IsMacService from "../../ui-logic/ContextServices/IsMac";
import Article from "../Article/Article";
import ArticleExtensions from "../Article/ArticleExtensions";
import Breadcrumb from "../Breadcrumbs/ArticleBreadcrumb";

const ArticlePage = ({ data, className }: { data: ArticlePageData; className?: string }) => {
	const theme = ThemeService.value;
	const isMac = IsMacService.value;

	interceptPrintShortkeys(isMac, theme);

	if (data.articleProps.welcome)
		return (
			<Welcome
				article
				title={t("so-far-its-empty")}
				body={<span>{t("article.create.body")}</span>}
				actions={<CreateFirstArticle />}
			/>
		);

	return (
		<>
			<Breadcrumb itemLinks={data.itemLinks} />
			<div className={classNames("article-page-wrapper", {}, [className])}>
				<Article data={data} />
			</div>
			<NextPrevious itemLinks={data.itemLinks} />
			<ArticleExtensions id={ContentEditorId} />
		</>
	);
};

export default styled(ArticlePage)`
	&.article-page-wrapper {
		flex: 1 1 0;
		display: flex;
		flex-direction: column;
	}
`;
