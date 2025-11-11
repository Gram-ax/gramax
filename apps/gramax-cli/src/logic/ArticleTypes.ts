import PageDataContext from "@core/Context/PageDataContext";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { StaticArticlePageData } from "./ArticleDataService";

export interface InitialData {
	data: {
		articlePageData: ExtendedArticlePageData;
		catalogProps: ClientCatalogProps;
	};
	context: PageDataContext;
}

export interface HtmlData {
	initialData: InitialData;
	logicPath: string;
	htmlContent: { styles: string; body: string };
}

export type ExtendedArticlePageData = StaticArticlePageData & {
	itemLinks: ItemLink[];
};

export interface InitialArticleData {
	catalogProps: ClientCatalogProps;
	articlesPageData?: ExtendedArticlePageData[];
	articlePageDataContext: PageDataContext;
}

export interface ArticleDataResult {
	article404Data: ExtendedArticlePageData;
	defaultArticleData: InitialArticleData;
	languageGroupedArticles: InitialArticleData[];
}
