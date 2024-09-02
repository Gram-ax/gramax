import ArticlePreview from "@components/Article/ArticlePreview";
import { classNames } from "@components/libs/classNames";
import Welcome from "@components/Welcome";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
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
	const pageProps = PageDataContextService.value;
	const props = CatalogPropsService.value;

	const shouldShowPreview =
		!pageProps.conf.isServerApp &&
		pageProps.language.content &&
		props.language &&
		pageProps.language.content != props.language;

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
		<>
			<Breadcrumb itemLinks={data.itemLinks} />
			<div
				className={classNames(
					className,
					{ "lang-style": pageProps.language.content && props.language != pageProps.language.content },
					["article-page-wrapper"],
				)}
			>
				<div className="main-article">
					<Article data={data} />
				</div>
				{shouldShowPreview && <ArticlePreview logicPath={data.articleProps.logicPath} />}
			</div>
			<NextPrevious itemLinks={data.itemLinks} />
			<ArticleExtensions id={ContentEditorId} />
		</>
	);
};

export default styled(ArticlePage)`
	flex: 1 1 0px;
	display: flex;
	flex-direction: row;
	justify-content: space-between;

	div.main-article {
		width: 100%;
	}

	&.lang-style > div.main-article {
		max-width: 69.5%;
		min-width: 69.5%;
	}
`;
