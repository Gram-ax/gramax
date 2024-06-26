import { classNames } from "@components/libs/classNames";
import Welcome from "@components/Welcome";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import registerMetric from "@core-ui/yandexMetric";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import CreateFirstArticle from "@ext/artilce/actions/CreateFirstArticle";
import useLocalize from "@ext/localization/useLocalize";
import { ContentEditorId } from "@ext/markdown/core/edit/components/ContentEditor";
import ThemeService from "../../extensions/Theme/components/ThemeService";
import interceptPrintShortkeys from "../../extensions/artilce/actions/SaveAsPdf/interceptPrintShortkeys";
import NextPrevious from "../../extensions/navigation/NextPrevious";
import IsMacService from "../../ui-logic/ContextServices/IsMac";
import Article from "../Article/Article";
import ArticleExtensions from "../Article/ArticleExtensions";
import Breadcrumb from "../Breadcrumbs/ArticleBreadcrumb";

const ArticlePage = ({ data, className }: { data: ArticlePageData; className?: string }) => {
	const theme = ThemeService.value;
	const isMac = IsMacService.value;
	const isLogged = PageDataContextService.value.isLogged;
	const IsServerApp = PageDataContextService.value.conf.isServerApp;
	const isProduction = PageDataContextService.value.conf.isProduction;
	if (IsServerApp && isProduction) registerMetric(data.catalogProps.name, isLogged);

	interceptPrintShortkeys(isMac, theme);

	if (data.articleProps.welcome)
		return (
			<Welcome
				article
				title={useLocalize("soFarItsEmpty")}
				body={<span>{useLocalize("createNewArticleDesc")}</span>}
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
