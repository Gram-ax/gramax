import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import registerMetric from "@core-ui/yandexMetric";
import { ArticleData } from "@core/SitePresenter/SitePresenter";
import ThemeService from "../../extensions/Theme/components/ThemeService";
import interceptPrintShortkeys from "../../extensions/artilce/actions/SaveAsPdf/interceptPrintShortkeys";
import NextPrevious from "../../extensions/navigation/NextPrevious";
import IsMacService from "../../ui-logic/ContextServices/IsMac";
import Article from "../Article/Article";
import ArticleExtensions from "../Article/ArticleExtensions";
import Breadcrumb from "../Breadcrumbs/ArticleBreadcrumb";

const ArticlePage = ({ data }: { data: ArticleData }) => {
	const theme = ThemeService.value;
	const isMac = IsMacService.value;
	const isLogged = PageDataContextService.value.isLogged;
	const IsServerApp = PageDataContextService.value.conf.isServerApp;
	const isProduction = PageDataContextService.value.conf.isProduction;
	if (IsServerApp && isProduction) registerMetric(data.catalogProps.name, isLogged);

	interceptPrintShortkeys(isMac, theme);

	return (
		<>
			<Breadcrumb itemLinks={data.itemLinks} />
			<Article data={data} />
			<NextPrevious itemLinks={data.itemLinks} />
			<ArticleExtensions />
		</>
	);
};

export default ArticlePage;
